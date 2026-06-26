# Release Checklist — SAHA Transport & Logistics (STL)

> **Read `AGENTS.md` first.** `/home/mignon/saha` is a **live production server**.
> Real users hit this app. Never run dev/test servers, `next dev`,
> `docker compose up`, migrations, or `manage.py runserver` against this
> checkout — they collide with the running systemd services and can take
> production down. This checklist is the repeatable, safe path for shipping a
> change.

This document is the Phase 0 deliverable: a repeatable safe workflow that must
exist **before** any code change phase (privacy fix, admin completion, hardening,
etc.) lands.

---

## Production facts (verified 2026-06-26)

| Thing | Value |
|-------|-------|
| App root (production checkout) | `/home/mignon/saha` |
| Frontend URL | `https://saha-stl.docufisc.de` |
| API URL | `https://api-saha.docufisc.de` |
| Frontend bind | `127.0.0.1:3030` (systemd `saha-frontend`) |
| API bind | `127.0.0.1:8030` (gunicorn, systemd `saha-api`) |
| PostgreSQL | **native** system service `postgresql@16-main` (NOT Docker) |
| Database | `saha_db` / user `saha_user` (creds in `/home/mignon/saha/.env`) |
| Redis | systemd `saha-redis` (`deploy/redis-saha.conf`) |
| Celery | systemd `saha-worker` + `saha-beat` |
| Services run as | user `mignon` (system units in `deploy/systemd/`) |
| Python venv | `/home/mignon/saha/backend/.venv/` |

> ⚠️ The scripts in `scripts/backup_db.sh` and `scripts/restore_db.sh` are
> **Docker-based and do NOT match production** (Postgres is native here). Use the
> native commands in this checklist instead until those scripts are fixed.

---

## Golden rules

1. **Branch off `main`** for every change. One phase = one branch = one PR.
2. **Build & test in an isolated clone or scratch environment** — never by
   starting servers on this checkout.
3. **Backup the DB and record the current commit SHA before any deploy.**
4. **Restart only the services a change actually affects** (see matrix below).
5. **Commit AND push** — pushing finished work is part of "done".

---

## 1. Before you write code

- [ ] `git fetch origin && git checkout main && git pull` (sync `main`).
- [ ] `git checkout -b <type>/<short-topic> main` (e.g. `fix/public-tracking-privacy`).
- [ ] Identify which services the change will affect (backend / frontend / tasks).

## 2. Develop & validate (isolated — never on prod services)

- [ ] Make the change minimal and consistent with surrounding code.
- [ ] Backend checks (in an isolated env / clone, never against prod data):
  - [ ] `python manage.py check`
  - [ ] `python manage.py makemigrations --check --dry-run` (no unexpected migrations)
  - [ ] Run relevant tests in `backend/tests/` with a throwaway test DB.
- [ ] Frontend checks:
  - [ ] `cd frontend && npm run lint`
  - [ ] `npx tsc --noEmit` (or `npm run build` in a scratch dir)
  - [ ] Confirm every new user-facing string has FR (source) + DE in `i18n-config.ts`.
- [ ] Review any new migration file by hand before it can ever run in prod.

## 3. Record rollback anchors (DO THIS EVERY DEPLOY)

- [ ] **Current commit SHA** (what you roll back to):
  ```bash
  git -C /home/mignon/saha rev-parse HEAD
  ```
- [ ] **DB backup** (native Postgres — adjust path as needed):
  ```bash
  set -a; . /home/mignon/saha/.env; set +a
  mkdir -p /home/mignon/saha/backups
  pg_dump "$DATABASE_URL" \
    > "/home/mignon/saha/backups/saha_db_$(date +%Y%m%d_%H%M%S).sql"
  # If DATABASE_URL is unset, use: PGPASSWORD="$POSTGRES_PASSWORD" \
  #   pg_dump -U "$POSTGRES_USER" -h 127.0.0.1 "$POSTGRES_DB" > backups/...sql
  ```
- [ ] Confirm the dump is non-empty (`ls -lh` the file).

## 4. Deploy

> Restart matrix — restart **only** what changed:
>
> | Change touches | Restart |
> |----------------|---------|
> | Backend Python (views/serializers/models) | `saha-api` |
> | Celery task code | `saha-worker` **and** `saha-beat` |
> | Frontend code | rebuild, then `saha-frontend` |
> | Migrations added | run migration, then `saha-api` (+ workers if needed) |

- [ ] Pull the reviewed, merged code onto the production checkout:
  ```bash
  git -C /home/mignon/saha fetch origin
  git -C /home/mignon/saha checkout main && git -C /home/mignon/saha pull
  ```
- [ ] **Backend, if migrations are required** (only after review + DB backup):
  ```bash
  cd /home/mignon/saha/backend
  .venv/bin/python manage.py migrate
  ```
- [ ] **Frontend, if changed** (build BEFORE restart so downtime is minimal):
  ```bash
  cd /home/mignon/saha/frontend
  npm ci   # only if package-lock changed
  npm run build
  ```
- [ ] Restart affected services:
  ```bash
  sudo systemctl restart saha-api        # backend
  sudo systemctl restart saha-worker saha-beat   # task code changes
  sudo systemctl restart saha-frontend   # frontend
  ```

## 5. Verify in production

- [ ] `systemctl status saha-api saha-frontend saha-worker saha-beat --no-pager`
      — all `active (running)`.
- [ ] `journalctl -u saha-api -n 100 --no-pager` — no tracebacks on boot.
- [ ] Health checks:
  - [ ] `curl -fsS https://api-saha.docufisc.de/api/services/ >/dev/null`
  - [ ] Frontend loads: `https://saha-stl.docufisc.de`
  - [ ] Exercise the specific flow you changed (e.g. `/suivi` tracking).
- [ ] Confirm both locales render (FR default + DE).

## 6. Finish

- [ ] `git push` your branch and open/merge the PR.
- [ ] Note the deployed SHA somewhere durable (PR comment / ops log).

---

## Rollback procedure

If a deploy goes bad:

1. **Code rollback** — check out the previously recorded SHA and rebuild/restart:
   ```bash
   git -C /home/mignon/saha checkout <previous-SHA>
   # frontend: cd frontend && npm run build
   sudo systemctl restart saha-api saha-frontend saha-worker saha-beat
   ```
2. **DB rollback** (only if a migration corrupted/changed data — last resort,
   causes data loss back to the dump):
   ```bash
   set -a; . /home/mignon/saha/.env; set +a
   psql "$DATABASE_URL" < /home/mignon/saha/backups/saha_db_<timestamp>.sql
   ```
3. Re-run the Section 5 verification.
4. Write up what failed before re-attempting.

---

## Exit criteria for Phase 0

- [x] A repeatable safe workflow is documented (this file).
- [x] Backup, rollback, and restart commands match production reality (native
      Postgres + systemd), not the stale Docker scripts.
- [ ] All subsequent change phases follow this checklist.
