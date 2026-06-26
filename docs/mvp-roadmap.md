# MVP Roadmap — SAHA Transport & Logistics (STL)

Status snapshot. The detailed hardening plan lives in
`docs/implementation_phases_findings.md`; this file is the high-level view.

## Completed MVP

A working transport & logistics web app (FR default / DE) where customers:
request shipments, track them by reference, see pricing and pickup/loading
schedules, and get web-push + in-app notifications. Admins manage requests
(state machine), the service catalog, prices, schedules, loading dates, and
broadcasts. Stack: Django + DRF + PostgreSQL + Redis + Celery; Next.js 14
frontend; all behind Nginx as systemd services. See `docs/architecture.md`.

## Hardening completed (and live in production)

Phases 0–5 of `implementation_phases_findings.md` are **deployed**:

- **P0** repeatable safe-deploy workflow (`docs/release-checklist.md`).
- **P1** secrets/runtime artifacts untracked; **all production secrets rotated**.
- **P2** anonymous tracking no longer leaks customer PII / address / prices /
  notes / photos.
- **P3** admin `active`/validity controls made real for pricing, schedules, and
  loading dates; new admin **service catalog** editor.
- **P4** throttles on auth/abuse-prone endpoints; password-reset validators +
  token invalidation + anti-enumeration; HTTP security headers.
- **P5** race-safe reference codes; push hygiene (logger, dead-device cleanup,
  subscribe upsert, unsubscribe); normalized-phone customer matching
  (anti-duplicate / anti-clobber); audit logs with actor + before/after.

## Fixes / follow-ups before further growth

- **P6 — Django 5.2 LTS upgrade:** validated and merged to `main`; **not yet
  deployed** (deploy rebuilds the server venv + applies additive celery
  beat/results migrations). Schedule a maintenance window.
- **CSP** is currently report-only — review reports, then switch to an enforcing
  `Content-Security-Policy`.
- **HSTS** at the TLS/Nginx edge (not yet set).
- **P8 — CI** (next): GitHub Actions for backend tests, frontend lint/typecheck,
  secret scanning, and a "no tracked runtime artifacts" guard.

## Next features (after hardening — P9)

In recommended order:
1. Authenticated customer request **detail** page (full private detail).
2. Status-change **history** per request (audit data already captured).
3. Admin **audit-log UI**.
4. Payment-status fields (no online payment yet).
5. Request message thread / internal + customer comments.
6. CSV import **preview** before applying.
7. Operational dashboard for failed notifications/emails.
8. Data-retention workflow for photos and PII.
9. Filter-aware CSV exports.
