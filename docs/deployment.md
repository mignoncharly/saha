# Deployment Guide — SAHA Transport & Logistics (STL)

> **Production runs as systemd services on a single VPS — NOT Docker.** The
> docker-compose files in this repo are for local/other environments only (see
> the bottom of this doc). For day-to-day releases follow
> `docs/release-checklist.md`; this file documents the production topology and
> the from-scratch setup.

## Production topology (current)

- Host: `/home/mignon/saha`, user `mignon`. Two domains behind Nginx:
  - Frontend → `https://saha-stl.docufisc.de` (Next.js `next start`, `127.0.0.1:3030`)
  - API → `https://api-saha.docufisc.de` (gunicorn `config.wsgi`, `127.0.0.1:8030`)
- **PostgreSQL** runs natively (`postgresql@16-main`), DB `saha_db` / `saha_user`.
- **Redis** runs as systemd `saha-redis` (`deploy/redis-saha.conf`).

### systemd services (`deploy/systemd/`)

| Service | Role |
|---------|------|
| `saha-api` | Django via gunicorn (`backend/.venv/bin/gunicorn config.wsgi`) |
| `saha-frontend` | Next.js (`npm run start`) |
| `saha-worker` | Celery worker |
| `saha-beat` | Celery beat |
| `saha-redis` | Redis |

Inspect/control: `systemctl status saha-api`, `journalctl -u saha-api -n 100`,
`sudo systemctl restart saha-api`.

## Routine release

See **`docs/release-checklist.md`** (the source of truth). In short:
1. Branch off `main`, validate in the isolated test env (never on prod services).
2. Back up the DB (`pg_dump "$DATABASE_URL"`) and record the current SHA.
3. Pull `main`. Backend code → restart `saha-api` (and `saha-worker`/`saha-beat`
   if task code changed). Frontend code → `npm run build` then restart
   `saha-frontend`. Run `migrate` only when a change adds migrations.
4. Verify (service states, `https://api-saha.docufisc.de/api/services/`,
   frontend `200`).

### Dependency upgrades (e.g. Django)
Build a **new venv alongside** the running one and swap it in, so rollback is a
directory swap + restart (the old venv is kept). See the Phase 6 deploy notes.

## First-time provisioning (native / systemd)

1. Provision Ubuntu 22.04+, install PostgreSQL 16, Redis, Python 3.12, Node 18+,
   Nginx, certbot.
2. Clone the repo to `/home/mignon/saha`. Copy `.env.example` → `.env` and fill:
   `SECRET_KEY` (`openssl rand -hex 32`), `DATABASE_URL`, `REDIS_URL`,
   `DJANGO_SETTINGS_MODULE=config.settings.production`, `ALLOWED_HOSTS`,
   `CORS_ALLOWED_ORIGINS`, `FRONTEND_URL`, `NEXT_PUBLIC_API_URL`,
   `NEXT_PUBLIC_WHATSAPP_NUMBER`, email settings, and VAPID keys
   (`bash scripts/generate_vapid_keys.sh` — base64url, not PEM).
   The provisioning helper `deploy/root_setup.sh` reads `deploy/.secrets.json`.
3. Backend: `python3 -m venv backend/.venv && backend/.venv/bin/pip install -r
   backend/requirements.txt`; `manage.py migrate`; `manage.py createsuperuser`;
   optionally `manage.py seed_initial_data`.
4. Frontend: `cd frontend && npm ci && npm run build`.
5. Install the unit files from `deploy/systemd/`, `systemctl daemon-reload`,
   enable + start each service.
6. Configure Nginx from `deploy/nginx/` and obtain TLS certs (certbot). Firewall:
   allow 80/443 only.
7. Daily DB backup via cron (native `pg_dump`, per the release checklist — not
   the Docker `scripts/backup_db.sh`).

## Health checks
- Frontend: `https://saha-stl.docufisc.de`
- API: `https://api-saha.docufisc.de/api/services/`
- Django admin: `https://api-saha.docufisc.de/admin/`

---

## Docker Compose — LOCAL/DEV ONLY

The `docker-compose*.yml` files and `scripts/backup_db.sh`/`restore_db.sh` are
for local development or a fresh non-systemd environment. **They do not reflect
production** and must not be run against `/home/mignon/saha`.
