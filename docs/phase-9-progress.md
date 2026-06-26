# Phase 9 — Progress / Handoff

Companion to **`docs/phase-9-plan.md`**. A continuing agent should: read the plan
(conventions + per-item spec), read this file (what's done / where to resume),
then implement the next `TODO` item on its own branch, run tests + `tsc`, commit,
push, and **update the matching row + "Last updated" here**.

## Status

| # | Feature | Status | Branch / notes |
|---|---------|--------|----------------|
| 1 | Authenticated customer request detail page | ✅ DONE | `feat/phase-9-customer-detail` (pushed; 69/69, tsc clean, no migration) |
| 2 | Status-change history per request | ✅ DONE | `feat/phase-9-status-history` (pushed; 70/70, tsc clean; **migration 0004**) |
| 3 | Admin audit-log UI | ✅ DONE | `feat/phase-9-audit-ui` (pushed; 69/69, tsc clean, no migration) |
| 4 | Payment status fields | ✅ DONE | `feat/phase-9-payment` (pushed; 68/68, tsc clean; **migration, see conflict note**) |
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

Items 1 and 2 are complete (branches pushed, **not yet merged** to `main`):
- **Item 1** `feat/phase-9-customer-detail` — owner detail endpoint
  `my-requests/<ref>/` + `/suivi` shows full detail for logged-in customers.
- **Item 2** `feat/phase-9-status-history` — `RequestStatusEvent` model
  (**migration 0004**), events written on admin status change (single + bulk),
  owner history endpoint `my-requests/<ref>/history/`, admin detail includes
  `status_events`, admin UI history card.

**Merge order when ready:** item 1, then item 2 (item 2 is off `main` and adds a
migration). Both touch `logistics/serializers.py`/`views.py`/`urls.py` and
`types/request.ts` — expect small, easily-resolved overlaps. Item 2's deploy
needs `migrate` + `saha-api` restart. (These two docs already live on `main`.)

**Next: item 5 — Request message thread** (per `phase-9-plan.md`; needs a
migration: new RequestComment model). Branch off `main`.

**⚠️ Migration numbering conflict:** items 2 and 4 each add a `0004_*` migration
off `main`. When merging, keep one and renumber the other (or `makemigrations
--merge`). Any further model-adding item should re-check the latest migration
number after the earlier ones merge.

Possible follow-up: wire the item-2 owner history endpoint into the item-1
customer detail page (a timeline on `/suivi`) — currently only the admin UI shows
the history.

---

_Last updated: 2026-06-26 — items 1, 2, 3, 4 DONE; next item 5._
