# Phase 9 — Feature Roadmap: Implementation Plan

Detailed, agent-actionable plan for the 10 Phase 9 features (from
`docs/implementation_phases_findings.md` / `docs/mvp-roadmap.md`). Progress is
tracked in **`docs/phase-9-progress.md`** — read that first to see what's done.

## Working conventions (READ FIRST)

- **Production safety:** `/home/mignon/saha` is a LIVE systemd-managed server
  (`AGENTS.md`). Never run dev servers / `runserver` / `docker compose` /
  migrations against it casually. Validate in isolation.
- **One feature = one branch off `main` = one PR.** Branch names `feat/phase-9-<slug>`.
- **Run backend tests (safe, isolated):**
  `cd backend && DJANGO_SETTINGS_MODULE=config.settings.test .venv/bin/python manage.py test`
  (`config.settings.test` = sqlite/locmem/eager — never touches prod Postgres/Redis).
- **Frontend check:** `cd frontend && npx tsc --noEmit` (no ESLint config exists).
- **i18n:** every user-facing FR string is the key; add a DE entry in
  `frontend/src/lib/i18n-config.ts`. FR is source/default.
- **Public vs admin API are separate** (`views.py`/`serializers.py` vs
  `admin_*` under `/api/admin/`). Customer-owned detail must filter by the
  requester's `customer_profile`.
- **Audit:** mutations to TransportRequest/PriceRule/ServiceType/PickupSchedule/
  LoadingDate are auto-logged by `apps/audit/signals.py` (actor via thread-local
  request in `apps/audit/local.py`). New audited models need a signal handler.
- **Migrations:** features that add models/fields need `makemigrations` + review;
  their deploy needs `migrate` (back up DB first — `docs/release-checklist.md`).
- **CI** runs on push (`.github/workflows/ci.yml`): backend tests, `tsc`,
  gitleaks. Keep it green.
- **NOTE:** prod runs Django 4.2; `main`'s requirements pin 5.2 (merged, not
  deployed). The committed `backend/.venv` is 4.2 — tests pass on both.

Admin nav lives in `frontend/src/lib/navigation.ts` (`adminNav`); admin pages
under `frontend/src/app/admin/`; editors follow the pattern in
`components/admin/AdminServiceEditor.tsx` (list + inline add/edit rows).

---

## 1. Authenticated customer request detail page  ← STARTED (see progress)
**Goal:** a logged-in customer sees the FULL detail of their OWN request
(address, prices, photos, notes) — not just the minimal public tracking shape.
- **Backend:** `CustomerTransportRequestDetailSerializer` (full owner fields,
  EXCLUDES `internal_notes`); `CustomerTransportRequestDetailView`
  (RetrieveAPIView, IsAuthenticated, queryset filtered to
  `request.user.customer_profile`); URL
  `my-requests/<reference_code>/` (before the public catch-all).
- **Frontend:** `/suivi` drill-in for a logged-in customer calls the customer
  endpoint; render address/prices/photos. New `CustomerTrackingRequest` type.
- **Tests:** owner gets full detail incl. address/prices; non-owner → 404;
  anonymous → 401; `internal_notes` absent. **No migration.**

## 2. Status-change history per request
**Goal:** persist and show each status transition (from→to, actor, timestamp).
- **Backend:** new model `RequestStatusEvent(request FK, from_status, to_status,
  actor FK null, note, created_at)` in `apps/logistics/models.py` (+ migration).
  Write a row in `AdminTransportRequestStatusUpdateView.update()` (and the bulk
  view) when status changes — actor = `request.user`. Add a read endpoint
  `transport-requests/my-requests/<ref>/history/` (owner) and include history in
  the admin request detail. Serializer `RequestStatusEventSerializer`.
- **Frontend:** timeline of events on the customer detail page (item 1) and the
  admin request detail (`app/admin/requests/[id]`).
- **Tests:** a status change creates an event with correct from/to/actor; history
  endpoint returns owner's events only. **Migration required.**
- Note: the audit log already records status_from/to, but this is a
  customer-facing, first-class history (audit is ops-facing).

## 3. Admin audit-log UI
**Goal:** browse the existing `AuditLog` rows in the admin.
- **Backend:** `AdminAuditLogListView` (ListAPIView, IsStaffOrAdmin, paginated,
  filter by entity_type/action/actor, order -created_at) +
  `AuditLogSerializer` (actor email, action, entity_type, entity_id, metadata,
  created_at). Mount under `/api/admin/audit/`. (Model exists: `apps/audit`.)
- **Frontend:** read-only admin page `app/admin/audit/` + nav entry
  (`adminNav`, icon e.g. `History`/`ScrollText`) + i18n. Table with filters.
- **Tests:** non-admin gets 401/403; list returns rows with actor email; filter
  by entity_type works. **No migration.**

## 4. Payment status fields (no online payment)
**Goal:** track payment state manually (admin), surface to the owner.
- **Backend:** add to `TransportRequest`: `payment_status`
  (`unpaid`/`partial`/`paid`/`refunded`, default `unpaid`), `amount_paid`
  (Decimal, default 0), `payment_note` (text). (+ migration). Add to the admin
  detail/update serializer and the customer detail serializer (read-only for
  customer). Audit signal already covers TransportRequest saves; optionally add
  payment_status to the before/after diff in `apps/audit/signals.py`.
- **Frontend:** admin request detail editable payment fields; show
  paid/unpaid badge on the customer detail page. i18n.
- **Tests:** admin can set payment_status/amount_paid; customer detail exposes
  them read-only. **Migration required.**

## 5. Request message thread (internal + customer comments)
**Goal:** a comment thread per request; `internal` comments admin-only.
- **Backend:** model `RequestComment(request FK, author FK null, body,
  is_internal bool, created_at)` (+ migration). Endpoints: owner can list/post
  non-internal comments on their request
  (`my-requests/<ref>/comments/`); admin can list/post all (internal + public)
  under `/api/admin/requests/<id>/comments/`. Serializers filter `is_internal`
  for non-staff. Audit signal handler for new comments (optional).
- **Frontend:** thread UI on customer detail + admin request detail; admin has an
  "internal" toggle. i18n.
- **Tests:** owner cannot see internal comments; owner can post a public comment;
  admin sees all. **Migration required.**

## 6. CSV import preview before applying
**Goal:** show what a pickup-schedule CSV import will create/update before commit.
- **Backend:** add a `?dry_run=1` (or a `preview/` endpoint) to
  `ImportPickupSchedulesView` (`apps/schedules/admin_views.py`) that parses and
  returns a summary `{to_create: [...], to_update: [...], errors: [...]}` WITHOUT
  writing. Keep the existing apply path for the real import.
- **Frontend:** `app/admin/schedules/page.tsx` — on file pick, call preview, show
  a confirmation table, then "Apply". Replace the blind import with preview→apply.
- **Tests:** preview returns counts and writes nothing; apply still works.
  **No migration.**

## 7. Operational dashboard for failed notifications/emails
**Goal:** admin visibility into push/email failures.
- **Backend:** `NotificationLog` already stores `sent_count`/`failed_count`.
  Add an admin endpoint summarizing recent logs with failures + a count of
  inactive/`gone` push subscriptions. Consider an `EmailLog` model if email
  failures need first-class tracking (email tasks currently
  `logger.exception` + raise — capture to a model or rely on logs). Decide:
  minimal = surface `NotificationLog` failures; fuller = add `EmailLog`.
- **Frontend:** a panel on `app/admin/dashboard/` (uses `recharts`) listing
  recent failures + counts. i18n.
- **Tests:** endpoint returns failure summary; admin-only. **Migration only if
  adding EmailLog.**

## 8. Data-retention workflow for photos and PII
**Goal:** purge/anonymize old request photos and customer PII per a policy.
- **Backend:** a Celery beat task (`apps/logistics` or `apps/customers`) that,
  for requests in a terminal state older than N days, deletes
  `TransportRequestPhoto` files and/or anonymizes customer PII (configurable via
  settings `DATA_RETENTION_DAYS`). Add an admin-trigger endpoint + a
  management command. Register the beat schedule (django-celery-beat).
  Log actions to `AuditLog`.
- **Frontend:** an admin settings/action button (optional) showing retention
  status. i18n.
- **Tests:** task deletes photos/anonymizes only eligible (old + terminal)
  records; recent/active untouched. **Migration only if adding policy fields.**
  Deploy restarts `saha-worker`/`saha-beat`.

## 9. Filter-aware CSV exports
**Goal:** the admin request CSV export honors the current list filters/search.
- **Backend:** `AdminTransportRequestExportCSVView` currently exports ALL. Reuse
  `TransportRequestFilter` + search/ordering (same as
  `AdminTransportRequestListView`) so the export matches the filtered view.
  Accept the same query params.
- **Frontend:** the export button passes the active filter querystring.
- **Tests:** export with a status filter returns only matching rows. **No
  migration.**

## 10. Admin service catalog editor
**DONE in Phase 3** (`app/admin/services/` + `AdminServiceEditor` +
`AdminServiceTypeSerializer`). Nothing to do unless extending fields.

---

## Suggested order
1 → 2 → 4 → 5 (customer-facing chain), then 3, 9, 6 (admin quality-of-life),
then 7, 8 (ops). Each is independent enough to ship alone.
