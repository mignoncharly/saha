# SAHA Transport & Logistics (STL) – Webapp

Transport & logistics web app (FR default / DE): customers request shipments,
track them by reference, view pricing and pickup/loading schedules, and receive
notifications; admins manage everything through an admin area.

> ⚠️ **Production is systemd-managed on a single VPS — not Docker.**
> `/home/mignon/saha` is a **live server**. Do **not** run `next dev`,
> `manage.py runserver`, `docker compose up`, or migrations against it — they
> collide with the running services. Read **`AGENTS.md`** before working here.

## Docs
- `AGENTS.md` — onboarding + production-safety rules (read first)
- `docs/architecture.md` — how the system fits together
- `docs/deployment.md` — production (systemd) deploy + provisioning
- `docs/release-checklist.md` — the routine release procedure
- `docs/security.md` — auth, data-exposure, secrets, rollback
- `docs/api-contract.md` — public + admin endpoints, status machine
- `docs/mvp-roadmap.md` — status + what's next

## Local development (Docker, optional)
The `docker-compose*.yml` files are for **local/dev only** and don't reflect
production. Copy `.env.example` → `.env`, then build/start with Docker Compose,
`migrate`, `createsuperuser`, and `seed_initial_data`. The frontend dev server
and Django admin run on localhost. See `docs/deployment.md` for details.
