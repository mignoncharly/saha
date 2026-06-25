# Architecture — SAHA Transport & Logistics (STL)

This document describes how the system is put together. For agent onboarding and
production-safety rules, read `AGENTS.md` at the repo root first.

## High-level topology

```
                        Internet (HTTPS)
                              |
                     +--------+--------+
                     |      Nginx      |   deploy/nginx/
                     |  reverse proxy  |
                     +---+---------+---+
       saha-stl.docufisc.de      api-saha.docufisc.de
                     |                 |
        +------------v------+  +-------v-------------+
        |  Next.js frontend |  | Django API (gunicorn)|
        |  next start :3030 |  | config.wsgi  :8030   |
        +-------------------+  +---+-----------+------+
                                   |           |
                          +--------v---+   +---v------+
                          | PostgreSQL |   |  Redis   |
                          +------------+   +---+------+
                                              | broker
                                 +------------v------------+
                                 | Celery worker + beat     |
                                 | (web push, async tasks)  |
                                 +--------------------------+
```

All services run as **systemd units** in production (`deploy/systemd/`), owned by
user `mignon`. See `AGENTS.md` for the service table and restart guidance.

## Backend (Django + DRF)

- Project config in `backend/config/`:
  - `urls.py` — root URLconf; every API is mounted under `/api/...`.
  - `settings/{base,local,production}.py` — split settings; prod uses
    `config.settings.production`.
  - `wsgi.py` / `asgi.py` — gunicorn serves `config.wsgi`.
  - `celery.py` — Celery app `stl`, config from Django settings (`CELERY_*`
    namespace), `autodiscover_tasks()`.
- Auth: custom user model `AUTH_USER_MODEL = 'accounts.User'`; token-based auth
  consumed by the frontend (`stl_admin_token`).
- Infra bindings (from `settings/base.py`): PostgreSQL (`DATABASES`), Redis
  (`CACHES` + Celery broker `CELERY_BROKER_URL = REDIS_URL`), Celery result
  backend `django-db`, timezone `Europe/Paris`.
- Domain apps live in `backend/apps/<app>/`. See `AGENTS.md` for the full
  app->route table.

### Public vs admin API separation

Domains that admins manage keep two parallel surfaces:

- Public: `views.py` + `serializers.py` + `urls.py` (mounted at e.g.
  `/api/transport-requests/`).
- Admin-only: `admin_views.py` + `admin_serializers.py` + `admin_urls.py`
  (mounted under `/api/admin/` via `apps.admin_api`).

Keep admin logic off the public routes.

### Core domain: TransportRequest

`apps/logistics/models.py` is the heart of the app. A `TransportRequest` links a
`Customer`, a `ServiceType`, and a `DestinationCity`, carries pickup details,
quantity/dimensions/weight, prices (`estimated_price`, `final_price`), notes, a
unique `reference_code`, and photos (`TransportRequestPhoto`).

Its lifecycle is a **state machine** enforced by
`apps/logistics/status.py` (`ALLOWED_STATUS_TRANSITIONS`). Status labels are
French (`STATUS_CHOICES`):

```
new -> contacted -> confirmed -> pickup_scheduled -> received
    -> loaded -> in_transit -> arrived_cameroon -> delivered
(any non-terminal state -> cancelled)
```

`delivered` and `cancelled` are terminal. When changing request workflow, update
**both** `STATUS_CHOICES` (labels) and `ALLOWED_STATUS_TRANSITIONS` (legal moves),
and check the admin views/serializers that drive transitions.

### Supporting domains

- `customers` — customer records (FK target of requests).
- `services`, `pricing`, `destinations` — catalog data shown publicly and
  managed in admin (`/api/services/`, `/api/prices/`, `/api/destination-cities/`).
- `schedules` — pickup schedules (`/api/pickup-schedules/`) and loading dates
  (`/api/loading-dates/`, `urls_loading.py`).
- `notifications` — customer notification center + web push (VAPID/`pywebpush`),
  largely driven by Celery tasks.
- `contact` — public contact form (`/api/contact/`).
- `audit`, `core`, `uploads` — cross-cutting: audit log, shared utilities, file
  uploads (request photos go to `request_photos/`).

## Frontend (Next.js 14, App Router)

- `frontend/src/app/` — route tree. Public pages are **French** (`page.tsx` home,
  `services/`, `tarifs/`, `suivi/`, `demande/`, `calendrier/`, `compte/`,
  `contact/`, `faq/`, `privacy/`). Admin area under `app/admin/`
  (`dashboard`, `requests/[id]`, `prices`, `schedules`, `loading-dates`,
  `notifications`, `login`).
- `frontend/src/lib/`:
  - `api.ts` — fetch wrapper. Base URL from `NEXT_PUBLIC_API_URL` (fallback
    `http://localhost:8000/api`). `parseApiError` understands DRF error shapes
    (`{detail}`, `{field: [...]}`, strings) and throws `ApiError`.
  - `auth.ts` — token storage (`stl_admin_token`); **SSR-safe** (guards on
    `typeof window`) because it's imported by server components too — do not add
    `"use client"` to it.
  - `constants.ts`, `navigation.ts`, `validators.ts` (zod), `i18n.tsx`,
    `whatsapp.ts`, `pwa.ts`, `faq.ts`.
- Forms use `react-hook-form` + `zod`; toasts via `sonner`; admin charts via
  `recharts`; icons via `lucide-react`. PWA assets in `public/`.
- Production: `npm run build` then `next start` on `:3030` (systemd
  `saha-frontend`).

## Request lifecycle (typical user flow)

1. A visitor submits the request form (`demande/`) -> `POST /api/transport-requests/`.
2. The API creates a `Customer` (if needed) + `TransportRequest` with status
   `new` and a unique `reference_code`; photos upload via `uploads`.
3. Customer tracks status at `suivi/` using the reference code.
4. Admin moves the request through the status machine in `app/admin/requests/[id]`
   via `/api/admin/...`; each legal transition is validated server-side.
5. Status changes / updates can fan out **notifications** (web push + the
   in-app notification center) through Celery tasks on the worker.

## Data & async

- **PostgreSQL** is the source of truth.
- **Redis** is the Celery broker (and Django cache).
- **Celery worker** runs async work (notably push notifications); **Celery beat**
  schedules periodic jobs. Both are separate systemd units — restart them when
  task code changes, not just the API.

## Where to change things

| Goal | Start here |
|------|-----------|
| API behavior / new endpoint | `backend/apps/<app>/{views,serializers,urls}.py` |
| Admin-only endpoint | `backend/apps/<app>/admin_*.py` + `apps/admin_api` |
| Model / schema | `backend/apps/<app>/models.py` (+ migration, reviewed) |
| Request workflow | `apps/logistics/status.py` + `models.py` STATUS_CHOICES |
| Async / notifications | `apps/notifications`, Celery tasks, worker/beat |
| Public page / UI | `frontend/src/app/.../page.tsx`, `src/components/` |
| API calls from UI | `frontend/src/lib/api.ts` |
| Validation rules | `frontend/src/lib/validators.ts` (zod) |

Keep all user-facing copy in **French** to match the existing app.
