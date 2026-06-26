# Codebase findings - 2026-06-26

Scope: static review of the live production checkout at `/home/mignon/saha`.
I read `AGENTS.md` and `docs/architecture.md` first, then reviewed backend,
frontend, deployment, security, docs, and tests. I did not start servers, run
migrations, restart services, or read secret values.

## Executive summary

The project is a solid MVP: the domain split is clear, public and admin API
surfaces are mostly separated, the request lifecycle is explicit, bilingual UI
support is in place, and there is useful test coverage for the core flows.

The biggest improvements are not architectural rewrites. They are targeted
hardening and completion work:

1. Reduce public data exposure on the reference-code tracking endpoint.
2. Fix admin API/UI mismatches for pickup schedules and active flags.
3. Remove tracked secrets/runtime artifacts from Git and rotate any exposed
   credentials.
4. Add throttling and password validation to the remaining auth/public write
   endpoints.
5. Make the docs match the actual systemd production deployment.

## What is working well

- Backend apps are organized by domain and are easy to navigate:
  `accounts`, `logistics`, `pricing`, `schedules`, `notifications`,
  `destinations`, `services`, `audit`, and shared `core` helpers.
- The architecture document accurately describes the current production shape:
  Nginx -> Next.js on `127.0.0.1:3030` and Django/gunicorn on
  `127.0.0.1:8030`, with PostgreSQL, Redis, Celery worker, and Celery beat.
- Public/admin API separation is mostly respected. Admin endpoints generally
  require `IsAuthenticated` plus `IsStaffOrAdmin`.
- The transport request lifecycle is explicit in
  `backend/apps/logistics/status.py`, and invalid admin transitions are rejected
  server-side.
- French/German i18n is present across frontend and backend. Backend model
  choices use lazy gettext, and frontend sends `Accept-Language`.
- There are focused backend tests for request creation, status transitions,
  pricing, schedules, notifications, and i18n.
- The frontend is feature-complete for an MVP: public pages, request form,
  tracking, account area, notifications, PWA install/push, and admin screens.

## High priority findings

### 1. Public tracking endpoint exposes the full request serializer

`PublicTransportRequestDetailView` uses `TransportRequestDetailSerializer`:

- `backend/apps/logistics/views.py:90`
- `backend/apps/logistics/serializers.py:22`
- `backend/apps/logistics/serializers.py:30`

That serializer returns `fields = '__all__'` plus nested customer data and
photos. For a public reference-code lookup, this can expose more than needed:
customer phone/email, pickup address, internal notes, prices, uploaded media
URLs, and other admin-oriented fields.

Recommendation: create a dedicated public tracking serializer with only:
`reference_code`, `status`, status label/timeline data, pickup city, destination
city, service type, created date, and maybe customer first name if needed. Keep
full details for authenticated customer/admin endpoints.

### 2. Admin pickup schedule create/edit does not match backend serializer

The frontend posts `region_name` and `cities`:

- `frontend/src/components/admin/AdminScheduleEditor.tsx:51`
- `frontend/src/components/admin/AdminScheduleEditor.tsx:81`
- `frontend/src/components/admin/AdminScheduleEditor.tsx:82`

But the backend marks `region_name` read-only and exposes `cities` as a
computed method field:

- `backend/apps/schedules/serializers.py:5`
- `backend/apps/schedules/serializers.py:6`
- `backend/apps/schedules/serializers.py:7`
- `backend/apps/schedules/serializers.py:11`

This makes the admin UI look like it can add/edit pickup tours by region and
cities, while the API cannot reliably persist those values through that
serializer.

Recommendation: add an admin-specific schedule serializer that accepts either
`region` or `region_name`, writes schedule-level `cities`, and returns the same
shape the UI expects. Add tests for admin create/edit.

### 3. Admin "active" controls are incomplete for pricing and schedules

The pricing UI shows and edits `active`:

- `frontend/src/components/admin/AdminPriceEditor.tsx:141`
- `frontend/src/components/admin/AdminPriceEditor.tsx:156`
- `frontend/src/components/admin/AdminPriceEditor.tsx:157`

But `PriceRuleSerializer` does not expose `active`, `valid_from`, or
`valid_until`:

- `backend/apps/pricing/serializers.py:8`
- `backend/apps/pricing/serializers.py:10`

Similarly, `LoadingDateSerializer` omits `active` even though the public endpoint
filters by active state:

- `backend/apps/schedules/serializers.py:16`
- `backend/apps/schedules/serializers.py:19`

Recommendation: expose `active` on admin serializers and either remove inactive
controls from the UI or make them work. Keep public serializers limited to
active records.

### 4. Tracked secrets and runtime artifacts are in Git

`git ls-files` shows these tracked files:

- `deploy/.secrets.json`
- `deploy/redis-data/dump.rdb`
- `deploy/redis-data/redis-saha.pid`

I did not open `deploy/.secrets.json`, but a tracked secrets file is a critical
repository hygiene issue. The Redis dump and PID file are runtime artifacts and
should not be versioned.

Recommendation:

- Remove these from Git history or rotate/replace the repository if secrets were
  ever pushed.
- Rotate any credentials that may have been stored in `deploy/.secrets.json`.
- Add ignore rules for `deploy/.secrets.json`, `deploy/redis-data/`, and other
  runtime data.
- Keep only safe templates, for example `deploy/.secrets.example.json`.

### 5. Password reset and public notification subscription need throttling

Login/register use `AuthRateThrottle`:

- `backend/apps/accounts/views.py:20`
- `backend/apps/accounts/views.py:22`
- `backend/apps/accounts/views.py:39`
- `backend/apps/accounts/views.py:42`

But password reset, password reset confirm, email verify, and push subscription
do not use explicit throttles:

- `backend/apps/accounts/views.py:54`
- `backend/apps/accounts/views.py:88`
- `backend/apps/accounts/views.py:107`
- `backend/apps/notifications/views.py:23`
- `backend/apps/notifications/views.py:25`

Recommendation: apply targeted throttles to password reset, verification resend,
verify, reset confirm, and push subscription. Keep rates conservative but not
annoying, for example lower per-IP rate for reset/email actions and moderate
rate for push subscriptions.

### 6. Password reset bypasses configured password validators

Registration validates passwords through Django validators, but reset-confirm
directly calls `user.set_password(new_password)`:

- `backend/apps/accounts/views.py:120`
- `backend/apps/accounts/views.py:123`

Recommendation: call `validate_password(new_password, user)` before saving, and
return translated serializer-style errors.

## Backend improvement opportunities

### Reference code generation can race

`generate_reference_code()` reads the latest matching code and increments it:

- `backend/apps/logistics/reference.py:4`
- `backend/apps/logistics/reference.py:10`
- `backend/apps/logistics/reference.py:12`

The model has a unique constraint, which helps, but concurrent submissions can
still generate the same next number and force one request to fail.

Recommendation: keep the human-readable format, but add retry-on-IntegrityError
or use a tiny database-backed counter table/sequence. This is small and avoids a
rare but user-visible 500 during busy periods.

### Customer matching by phone can overwrite data

Request submission uses `Customer.objects.get_or_create(phone=phone)` and then
updates the existing customer's name/email/language:

- `backend/apps/logistics/views.py:50`
- `backend/apps/logistics/views.py:60`

This is pragmatic, but shared family/company phone numbers can cause accidental
data merging.

Recommendation: normalize phone numbers and consider matching by authenticated
user first, then phone/email. For anonymous requests, avoid overwriting existing
customer identity fields too aggressively.

### Audit trail lacks actor attribution

Audit signals create records, but actor is always `None`:

- `backend/apps/audit/signals.py:12`
- `backend/apps/audit/signals.py:20`
- `backend/apps/audit/signals.py:30`

Recommendation: either wire request-user context into admin mutations or rename
this feature as a change log. For admin accountability, record actor, action,
entity, before/after status, and timestamp.

### Web push failures should use structured logging

Push failure handling prints to stdout:

- `backend/apps/notifications/webpush.py:23`
- `backend/apps/notifications/webpush.py:24`

Recommendation: use `logger.warning` or `logger.exception` with endpoint redaction
and mark expired subscriptions inactive when pywebpush returns a gone/invalid
subscription response.

### Price estimate logic is intentionally basic

`PriceEstimateView` picks the cheapest active rule for a service and multiplies
by quantity. It ignores destination, validity dates, dimensions, and weight.

Recommendation: keep this as "indicative price" for now, but document it in
`docs/api-contract.md` and consider a next-step estimator that uses service,
unit, destination, and date validity.

## Frontend improvement opportunities

### Auth token storage is simple but high blast radius under XSS

The frontend stores DRF tokens in `localStorage`:

- `frontend/src/lib/auth.ts:5`
- `frontend/src/lib/auth.ts:9`
- `frontend/src/lib/auth.ts:13`

This is common in MVPs but any XSS can read the token.

Recommendation: for the next security pass, move admin/customer auth to
HttpOnly secure cookies or short-lived access tokens plus refresh flow. In the
short term, tighten frontend security headers and avoid adding unsafe HTML.

### Translation maintenance needs guardrails

The single `frontend/src/lib/i18n-config.ts` dictionary is workable, but it is
large and missing keys fall back to French. That is acceptable for launch, but
it gets harder to maintain as admin and account flows grow.

Recommendation: add a lightweight test/script that extracts `t("...")` keys and
fails when German entries are missing, or at least reports missing keys in CI.

### Admin destructive actions are too easy

Deletes use native `confirm()` and bulk status changes apply immediately. That
is okay for an MVP, but real operations benefit from clearer confirmation.

Recommendation: add a small reusable confirmation modal for deletes and
high-impact bulk transitions. Include affected count and target status.

### Avoid full reload after CSV import

The schedules import page calls `window.location.reload()` after import.

Recommendation: refresh component state instead. This keeps the admin app
predictable and avoids losing filters or scroll state.

### PWA and notification polish

Push notifications and the notification center are present. Useful next steps:

- Upsert push subscriptions by endpoint instead of returning a duplicate error.
- Let users unsubscribe/deactivate a device from the account UI.
- Include a URL in push payloads so notification clicks open the relevant
  request or notifications page.
- Remove production `console.log` from service worker registration.

## Security and operations

### Media files are public through Nginx

Nginx serves all backend media directly:

- `deploy/nginx/api-saha.docufisc.de:15`
- `deploy/nginx/api-saha.docufisc.de:16`

That means uploaded request photos are public to anyone with the URL. Combined
with the public full-detail tracking endpoint, this increases privacy risk.

Recommendation: do not return photo URLs from public tracking. For admin access,
either keep direct media URLs but require unguessable paths, or proxy protected
media through authenticated endpoints if the business treats photos as sensitive.

### Nginx config in repo only shows port 80

The checked-in Nginx files listen on port 80:

- `deploy/nginx/api-saha.docufisc.de:2`
- `deploy/nginx/saha-stl.docufisc.de:34`

Production may have SSL termination elsewhere, but the repository does not show
the full HTTPS redirect/certbot story.

Recommendation: document the actual production TLS setup and keep committed
Nginx templates aligned with it. If these files are meant to be active, add 443
server blocks or explicit upstream documentation.

### Deployment docs are stale

`docs/deployment.md`, `README.md`, and `Makefile` still describe Docker Compose
as the deployment path, while `AGENTS.md` and `docs/architecture.md` correctly
say production uses systemd. This is risky for future maintenance because the
wrong command on this server can collide with production.

Recommendation: update `docs/deployment.md` for the systemd deployment and move
Docker Compose instructions into a clearly labeled local-development section.

### Empty docs should be filled or removed

These tracked docs are empty:

- `docs/security.md`
- `docs/api-contract.md`
- `docs/mvp-roadmap.md`

Recommendation: fill them with the current API contract, security posture, and
MVP roadmap, or remove the empty files until they are useful.

### Basic security headers are split and incomplete

Django adds a CSP-like header in `apps.core.middleware.SecurityHeadersMiddleware`,
but this primarily affects API responses. The Next.js frontend should own browser
security headers for the actual UI.

Recommendation: add frontend response headers in `next.config.js` or Nginx:
`Content-Security-Policy`, `X-Frame-Options`/`frame-ancestors`, `Referrer-Policy`,
`Permissions-Policy`, and HSTS at the TLS layer. Avoid an over-strict CSP first;
start report-only if needed.

## Testing gaps

Add focused tests for:

- Public tracking serializer does not expose customer contact data, internal
  notes, prices, or photos.
- Admin pickup schedule create/edit with region and cities.
- Admin price and loading-date active/inactive behavior.
- Password reset validates password strength.
- Password reset and push subscription throttles.
- Reference generation duplicate retry path.
- Audit actor attribution once implemented.

## Feature suggestions that fit the current product

These are practical additions, not overengineering:

1. Customer-facing request detail page for logged-in users with full private
   details, while guest tracking remains minimal.
2. Admin activity log view filtered by request, actor, and date.
3. Status-change history per request, including timestamp, actor, note, and
   notification result.
4. Customer/admin message thread on a request, with WhatsApp as a shortcut but
   not the only record.
5. Payment status fields without online payment yet: `unquoted`, `quoted`,
   `deposit_received`, `paid`, `balance_due`.
6. Import preview for CSV schedules before applying changes.
7. Basic operational dashboard: failed notifications, unsent emails, recent
   request volume, and upcoming loading dates.
8. Data retention workflow for photos and personal data after delivery/cancel.
9. Export filters applied consistently to CSV exports.
10. Admin-managed service catalog page, since backend endpoints exist but there
    is no dedicated UI in the current admin nav.

## Suggested next work order

1. Repository hygiene: untrack secrets/runtime files, rotate secrets, update
   `.gitignore`.
2. Privacy fix: dedicated public tracking serializer.
3. Admin completion: schedule serializer and active flags for pricing/loading.
4. Auth hardening: throttles and reset password validation.
5. Documentation: systemd deployment guide, API contract, security page.
6. Tests for each fix above.

## Verification notes

This was a static audit. I intentionally did not run `next dev`, `docker compose`,
migrations, `manage.py runserver`, or production service restarts. I also did not
run tests against this production checkout.
