# AGENTS.md — Onboarding guide for AI coding agents (Codex, etc.)

> **Purpose of this file.** When the primary agent (Claude) is unavailable (token
> limit reached, etc.), another agent such as **Codex** should read this file
> first to understand *what this project is* and *how to safely work on it* for
> bug fixes, improvements, and new features. Keep this file up to date when the
> architecture changes.

---

## ⚠️ Read this first — production safety

- **`/home/mignon/saha` is a LIVE production server.** Real users hit this app.
- **Never** run dev/test servers, `next dev`, `docker compose up`, migrations,
  or `manage.py runserver` against this checkout. They can collide with the
  running services and take production down.
- The app runs as **systemd services** (see below), *not* via docker-compose in
  production. Docker compose files exist but are for local/other environments.
- To validate changes, prefer: type-checking, linting, reading code, and unit
  tests in an isolated environment — not by starting servers here.
- **Workflow rule:** committing **and pushing** completed changes is part of
  "done". Don't leave finished work uncommitted. Branch off `main` for new work.

---

## What this project is

**SAHA Transport & Logistics (STL)** — a web app (MVP) for a transport &
logistics company. Customers request shipments/transport, track them, view
pricing and pickup/loading schedules, and receive notifications. Admins manage
requests, prices, schedules, and notifications through an admin area.

- Repo: `git@github.com:mignoncharly/saha.git`
- Supported UI languages: **French and German**. French is the source/default
  language; all user-facing strings must use the existing i18n utilities.
- Two deployments behind Nginx:
  - Frontend → `https://saha-stl.docufisc.de`
  - API → `https://api-saha.docufisc.de`

---

## Tech stack

### Backend — `backend/` (Django + DRF)
- Django 4.2 + Django REST Framework, PostgreSQL, Redis, Celery (worker + beat).
- Web push notifications via `pywebpush` (VAPID keys).
- Served by **gunicorn** (`config.wsgi`) in production.
- Settings split: `config/settings/{base,local,production}.py`
  - Production uses `DJANGO_SETTINGS_MODULE=config.settings.production`.
- Entrypoint URLs: `backend/config/urls.py` (all API routes are under `/api/...`).

**Django apps (`backend/apps/`)** — each is a domain:
| App | Responsibility |
|-----|----------------|
| `accounts` | auth / users (`/api/auth/`) |
| `services` | services offered (`/api/services/`) |
| `pricing` | prices (`/api/prices/`) |
| `schedules` | pickup schedules + loading dates (`/api/pickup-schedules/`, `/api/loading-dates/`) |
| `destinations` | destination cities (`/api/destination-cities/`) |
| `logistics` | transport requests — core domain (`/api/transport-requests/`) |
| `notifications` | customer + web-push notifications (`/api/notifications/`) |
| `customers` | customer records (`/api/customers/`) |
| `contact` | contact form (`/api/contact/`) |
| `admin_api` | admin-only endpoints (`/api/admin/`) |
| `audit`, `core`, `uploads` | cross-cutting: audit log, shared utils, file uploads |

A typical app has: `models.py`, `serializers.py`, `views.py`, `urls.py`,
`filters.py`, `admin.py`, and `migrations/`. Some (e.g. `logistics`) also have
**admin-specific** counterparts: `admin_views.py`, `admin_serializers.py`,
`admin_urls.py`, plus domain helpers like `status.py`, `reference.py`.

### Frontend — `frontend/` (Next.js 14 App Router + TypeScript + Tailwind)
- Next.js 14.2 (App Router), React 18, TypeScript, Tailwind CSS.
- Forms: `react-hook-form` + `zod` (`@hookform/resolvers`).
- UI: `lucide-react` icons, `recharts` (admin dashboard charts), `sonner` (toasts),
  `qrcode`. PWA-capable (icons in `public/`).
- Served by `next start` on port 3030 in production.

**Structure (`frontend/src/`)**:
- `app/` — App Router pages. Public routes retain their French URL slugs but
  render in French or German: `page.tsx` (home),
  `services/`, `tarifs/` (pricing), `suivi/` (tracking), `demande/` (request),
  `calendrier/` (schedule), `compte/` (account), `contact/`, `faq/`, `privacy/`.
  Admin area under `app/admin/`: `dashboard/`, `requests/` (+ `[id]/`),
  `prices/`, `schedules/`, `loading-dates/`, `notifications/`, `login/`.
- `components/` — shared UI components.
- `hooks/`, `lib/` (API client / helpers), `types/`, `styles/`.
- API base URL comes from `NEXT_PUBLIC_API_URL`.

---

## How it runs in production (systemd)

Services live in `deploy/systemd/` and run as user `mignon`:

| Service | What it does | Bind |
|---------|--------------|------|
| `saha-api.service` | Django via gunicorn (`config.wsgi`, 3 workers) | `127.0.0.1:8030` |
| `saha-frontend.service` | Next.js `npm run start` | `127.0.0.1:3030` |
| `saha-worker.service` | Celery worker | — |
| `saha-beat.service` | Celery beat (scheduler) | — |
| `saha-redis.service` | Redis | — |

- Python venv for the API: `backend/.venv/`.
- Nginx site configs: `deploy/nginx/` (`api-saha.docufisc.de`, `saha-stl.docufisc.de`).
- Inspect / control (read logs before touching anything):
  - `systemctl --user status saha-api` (or run as the service user / via sudo as configured)
  - `journalctl -u saha-api -n 100`
- **Restart only when a change requires it and you understand the impact.**
  - Backend code change → restart `saha-api` (and `saha-worker`/`saha-beat` if tasks changed).
  - Frontend change → `npm run build` in `frontend/`, then restart `saha-frontend`.

---

## Common tasks — where to look

- **Fix/extend an API endpoint:** find the app in `backend/apps/<app>/`, edit
  `views.py`/`serializers.py`/`models.py`. Admin endpoints are in the
  `admin_*` files. Routes are wired in the app's `urls.py` and `config/urls.py`.
- **Model/schema change:** edit `models.py`, then create a migration
  (`makemigrations`) in an isolated env and review it before it ever runs in prod.
- **Frontend page/UI:** edit under `frontend/src/app/.../page.tsx` and
  `frontend/src/components/`. Add French source copy and a natural German entry
  in `frontend/src/lib/i18n-config.ts`; never leave visible literals untranslated.
- **Notifications / scheduled jobs:** `apps/notifications`, Celery tasks,
  `saha-worker`/`saha-beat`.
- **Pricing / schedules logic:** `apps/pricing`, `apps/schedules`,
  `apps/logistics/status.py` & `reference.py`.

---

## Testing & checks

- **Backend tests:** `backend/tests/` —
  `test_pricing.py`, `test_schedules.py`, `test_transport_requests.py`,
  `test_notifications.py`. Run with Django's test runner / pytest in an
  isolated environment (do not point them at production data).
- **Frontend:** `cd frontend && npm run lint`. Type-check via `tsc`/`next build`
  in a scratch environment. `tsconfig.tsbuildinfo` is a build artifact (often
  shows as modified — usually safe to ignore in diffs).

---

## Conventions & gotchas

- Routes keep their French slugs. UI copy is bilingual (French/German); use the
  frontend translation utilities and Django gettext catalogs consistently.
- Public API vs admin API are deliberately separated (`views.py` vs
  `admin_views.py`, `urls.py` vs `admin_urls.py`). Don't expose admin logic on
  public routes.
- Secrets live in `.env` (not committed). `.env.example` documents required
  vars: `SECRET_KEY`, `POSTGRES_PASSWORD`, `ALLOWED_HOSTS`,
  `CORS_ALLOWED_ORIGINS`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WHATSAPP_NUMBER`,
  email settings, VAPID keys.
- More docs in `docs/`: `deployment.md`, `api-contract.md`, `security.md`,
  `mvp-roadmap.md` (note: `architecture.md` is currently empty).

---

## Suggested workflow for an agent picking up work here

1. Read this file and the relevant `docs/` page for context.
2. Locate the right Django app or Next.js route from the tables above.
3. Make the change; keep it minimal and consistent with surrounding code.
4. Verify with targeted tests / lint / type-check in an isolated environment —
   **never** by starting servers on this production checkout.
5. Branch off `main`, commit with a clear message, and **push**.
6. Only restart the affected systemd service(s) if the change needs it.
