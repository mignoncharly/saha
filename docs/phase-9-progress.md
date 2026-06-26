# Phase 9 — Progress / Handoff

Companion to **`docs/phase-9-plan.md`**. A continuing agent should: read the plan
(conventions + per-item spec), read this file (what's done / where to resume),
then implement the next `TODO` item on its own branch, run tests + `tsc`, commit,
push, and **update the matching row + "Last updated" here**.

## Status

| # | Feature | Status | Branch / notes |
|---|---------|--------|----------------|
| 1 | Authenticated customer request detail page | ✅ DONE | `feat/phase-9-customer-detail` (pushed; 69/69, tsc clean, no migration) |
| 2 | Status-change history per request | ⬜ TODO | migration required |
| 3 | Admin audit-log UI | ⬜ TODO | no migration (AuditLog exists) |
| 4 | Payment status fields | ⬜ TODO | migration required |
| 5 | Request message thread | ⬜ TODO | migration required |
| 6 | CSV import preview | ⬜ TODO | no migration |
| 7 | Ops dashboard (failed notifs/emails) | ⬜ TODO | migration only if EmailLog |
| 8 | Data-retention workflow | ⬜ TODO | restarts worker/beat |
| 9 | Filter-aware CSV export | ⬜ TODO | no migration |
| 10 | Admin service catalog editor | ✅ DONE (Phase 3) | — |

Legend: ⬜ TODO · 🟡 in progress · ✅ done.

## How to verify your work
- Backend: `cd backend && DJANGO_SETTINGS_MODULE=config.settings.test .venv/bin/python manage.py test`
- Frontend: `cd frontend && npx tsc --noEmit`
- Never start dev servers on this host (production). Deploy via `docs/release-checklist.md`.

## Resume notes
**Item 1 is complete** on branch `feat/phase-9-customer-detail` (pushed, not yet
merged to `main`). Backend: `CustomerRequestDetailView` +
`CustomerTransportRequestDetailSerializer` + URL `my-requests/<ref>/`. Frontend:
`/suivi` uses the owner endpoint when `role === "customer"` and renders
address/prices/photos; `CustomerTrackingRequest` type in `types/request.ts`.
Tests: `backend/tests/test_customer_request_detail.py`.

**Next: item 2 — status-change history per request** (per `phase-9-plan.md`).
Branch off `main`. It needs a NEW model + migration (`RequestStatusEvent`) and a
write in `AdminTransportRequestStatusUpdateView.update()`; surface history on the
item-1 customer detail page and the admin request detail. Remember to run
`makemigrations` and review the migration.

To merge item 1 first: it's a normal PR to `main` (no migration, no conflict
expected — only `serializers.py`/`views.py`/`urls.py` additions + `/suivi`).

---

_Last updated: 2026-06-26 — item 1 DONE (this session); items 2-9 TODO._
