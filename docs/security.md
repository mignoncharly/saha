# Security — SAHA Transport & Logistics (STL)

Operational security model for the app. Read `AGENTS.md` (repo root) for
production-safety rules and `docs/architecture.md` for how the system fits
together. `/home/mignon/saha` is a **live production server**.

## Authentication & authorization

- **Custom user model** `accounts.User` (`AUTH_USER_MODEL`), with a `role`
  (`admin` / `staff` / `customer`). The frontend resolves `admin`/`staff` → admin
  UI access; everyone else is a customer.
- **Token auth** (DRF `TokenAuthentication`) is the primary scheme consumed by
  the frontend; the token is stored client-side as `stl_admin_token`.
  `SessionAuthentication` is also enabled (Django admin / browsable API).
- Admin-only endpoints require `IsAuthenticated` + `IsStaffOrAdmin`
  (`apps/core/permissions.py`). Customer endpoints require `IsAuthenticated`.
- **Password reset** (`/api/auth/password-reset/…`):
  - Generic response regardless of whether the email exists (anti-enumeration).
  - Email lookup is case-insensitive (`email__iexact`).
  - Confirm enforces `AUTH_PASSWORD_VALIDATORS` and returns field errors.
  - On success the user's auth token is deleted (logs out other sessions).

## Data exposure rules

- **Public vs admin API are separate surfaces** (`views.py`/`serializers.py` vs
  `admin_views.py`/`admin_serializers.py`, mounted under `/api/admin/`). Never
  expose admin logic on a public route.
- **Anonymous shipment tracking** (`GET /api/transport-requests/{ref}/`) uses
  `PublicTransportRequestTrackingSerializer`, which exposes only coarse progress
  (reference, status, service/destination names, pickup city, dates). It
  **never** returns customer name/phone/email, the full pickup address, internal
  notes, prices, or photos. The full `TransportRequestDetailSerializer` is for
  admin/authenticated detail only.
- Catalog lists (services/prices/schedules/loading-dates) only return `active`
  (and, for prices, in-window) rows publicly; `active`/validity/`sort_order`
  fields are admin-only serializers.

## Rate limiting (per-IP unless noted)

| Scope | Limit | Applies to |
|-------|-------|-----------|
| `public_submit` | 10/min | transport-request create |
| `contact` | 5/min | contact form |
| `auth` | 10/min | login / register |
| `password_reset` | 5/min | reset request + confirm |
| `email_verification` | 10/min | verify-email |
| `resend_verification` | 3/min (per user) | resend verification |
| `push_subscription` | 30/min | push subscribe/unsubscribe |

Defined in `apps/core/throttles.py`. Read endpoints are intentionally not
throttled.

## Media handling

- Request photos upload to `MEDIA_ROOT/request_photos/` via `apps.uploads`
  (extension + size validators). In production Nginx serves `MEDIA_URL`; Django
  only serves media when `DEBUG` is on.
- Photos are **not** exposed on the public tracking endpoint.

## Secrets policy

- Real secrets live in `/home/mignon/saha/.env` and `deploy/.secrets.json` —
  **both gitignored**, never committed. Templates (`.env.example`,
  `deploy/.secrets.example.json`, `deploy/redis-saha.conf.example`) are tracked.
- Required vars are documented in `.env.example`: `SECRET_KEY`, DB/Redis
  credentials (`DATABASE_URL`, `REDIS_URL`), `ALLOWED_HOSTS`,
  `CORS_ALLOWED_ORIGINS`, email settings, VAPID keys
  (`VAPID_PRIVATE_KEY`/`VAPID_PUBLIC_KEY` are base64url raw — see
  `scripts/generate_vapid_keys.sh`).
- **Rotation:** if a secret is ever committed/leaked, rotate it (new value in
  `.env` + the relevant service) — removing the file from git does not un-leak
  history. All production secrets were rotated on 2026-06-26.

## HTTP security headers

Set in `frontend/next.config.js` (served behind Nginx): `X-Frame-Options: DENY`,
`X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, and a
**`Content-Security-Policy-Report-Only`** (report-first; tighten to an enforcing
CSP after observing reports). **HSTS** belongs at the TLS/Nginx edge (TODO).

## Production-safe operations

- Never run dev servers, `next dev`, `manage.py runserver`, `docker compose up`,
  or migrations casually against this checkout — they collide with the live
  systemd services.
- Validate changes with type-checks, `py_compile`, and the **isolated** test
  runner (sqlite + locmem + eager Celery) — never against prod Postgres/Redis.
  See `docs/release-checklist.md`.

## Incident & rollback basics

- **Always back up the DB before a deploy** (`pg_dump "$DATABASE_URL"`), record
  the current commit SHA. See `docs/release-checklist.md`.
- **Code rollback:** check out the previous SHA, rebuild frontend if needed,
  restart the affected systemd services.
- **Dependency/venv rollback** (Django-upgrade-style deploys): the new venv is
  built alongside the old one and swapped in; roll back by swapping the
  directories back and restarting.
- **DB rollback:** restore the pre-deploy `pg_dump` (last resort — data loss back
  to the dump).
- **Leaked secret:** rotate first, deploy new value, restart, confirm logs.
