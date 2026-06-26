# Phase 9 — Progress / Handoff

Companion to **`docs/phase-9-plan.md`**. A continuing agent should: read the plan
(conventions + per-item spec), read this file (what's done / where to resume),
then implement the next `TODO` item on its own branch, run tests + `tsc`, commit,
push, and **update the matching row + "Last updated" here**.

## Status

| # | Feature | Status | Branch / notes |
|---|---------|--------|----------------|
| 1 | Authenticated customer request detail page | ✅ DONE (merged) | `feat/phase-9-customer-detail` (pushed; 69/69, tsc clean, no migration) |
| 2 | Status-change history per request | ✅ DONE | `feat/phase-9-status-history` (pushed; 70/70, tsc clean; **migration 0004**) |
| 3 | Admin audit-log UI | ✅ DONE | `feat/phase-9-audit-ui` (pushed; 69/69, tsc clean, no migration) |
| 4 | Payment status fields | ✅ DONE | `feat/phase-9-payment` (pushed; 68/68, tsc clean; **migration, see conflict note**) |
| 5 | Request message thread | ✅ DONE | merged to main |
| 6 | CSV import preview | ✅ DONE | `feat/phase-9-csv-import-preview` (pushed; 84/84, tsc clean, no migration) |
| 7 | Ops dashboard (failed notifs/emails) | ✅ DONE | `feat/phase-9-ops-dashboard` (pushed; 84/84, tsc clean, no migration) |
| 8 | Data-retention workflow | ⬜ TODO | restarts worker/beat |
| 9 | Filter-aware CSV export | ⬜ TODO | no migration |
| 10 | Admin service catalog editor | ✅ DONE (Phase 3) | — |

Legend: ⬜ TODO · 🟡 in progress · ✅ done.

## How to verify your work
- Backend: `cd backend && DJANGO_SETTINGS_MODULE=config.settings.test .venv/bin/python manage.py test`
- Frontend: `cd frontend && npx tsc --noEmit`
- Never start dev servers on this host (production). Deploy via `docs/release-checklist.md`.

## Resume notes

Items 1-7 are complete. Items 6 and 7 are independent admin quality-of-life
branches and do not add migrations.

- **Item 6** `feat/phase-9-csv-import-preview` — pickup schedule CSV imports now
  preview create/update/error rows with `?dry_run=1` before applying.
- **Item 7** `feat/phase-9-ops-dashboard` — admin dashboard now surfaces push
  notification failures, recent failed notification logs, and inactive push
  subscriptions. Email failures remain server-log-only; no `EmailLog` model was
  added.

**Next: item 8 — Data-retention workflow** (per `phase-9-plan.md`; likely
worker/beat restart on deploy, migration only if adding policy fields). Branch
off `main`.

Django 5.2 production deploy remains deferred for a maintenance window.

---

_Last updated: 2026-06-26 — item 7 DONE; next item 8._
