# API Contract — SAHA Transport & Logistics (STL)

All API routes are mounted under `/api/...` (see `backend/config/urls.py`).
Base URL in production: `https://api-saha.docufisc.de`. The frontend sets it via
`NEXT_PUBLIC_API_URL`.

- **Auth:** DRF token. Send `Authorization: Token <key>` on authenticated calls.
  Obtain a token from `POST /api/auth/login/` or `…/register/`.
- **Locale:** send `Accept-Language: fr|de`; DRF/Django localize messages and DB
  label fields. French is the default/source language.
- **Errors:** DRF shapes — `{"detail": "..."}`, `{"field": ["msg", ...]}`, or a
  string. The frontend's `parseApiError` understands all three.

## Public endpoints (no auth)

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/services/` | active service types |
| GET | `/api/prices/` | active + in-window price rules |
| GET | `/api/prices/estimate/?service_type_id=&quantity=&destination_city_id=` | cheapest current rule × qty |
| GET | `/api/pickup-schedules/` | active pickup schedules |
| GET | `/api/loading-dates/` | upcoming active loading dates |
| GET | `/api/destination-cities/` | destination cities |
| POST | `/api/transport-requests/` | create a request (multipart; photos optional). Throttle `public_submit` 10/min |
| GET | `/api/transport-requests/{reference_code}/` | **privacy-safe tracking** (coarse status only) |
| POST | `/api/contact/` | contact form. Throttle `contact` 5/min |
| POST | `/api/notifications/subscribe/` | upsert a web-push subscription by endpoint |
| POST | `/api/notifications/unsubscribe/` | deactivate a device by endpoint |
| GET | `/api/notifications/vapid-public-key/` | VAPID public key for the browser |

### Create transport request — request body (multipart)
`consent` (must be true), `full_name`, `phone` (required); `whatsapp_number`,
`email`, `service_type`, `pickup_city`, `pickup_address`, `preferred_pickup_date`,
`destination_city`, `quantity`, `dimensions`, `estimated_weight`, `description`,
`customer_notes`, `photos[]`. Response: created fields + generated
`reference_code` (`STL-YYYY-NNNNNN`, assigned race-safely).

### Public tracking response (the only fields exposed)
`reference_code`, `status`, `status_display`, `service_type_name`,
`pickup_city`, `destination_name`, `preferred_pickup_date`, `created_at`.

## Auth endpoints (`/api/auth/`)

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `login/` | – | → `{token, user}`. Throttle `auth` |
| POST | `register/` | – | → `{token, user}`. Throttle `auth` |
| GET | `me/` | token | current user |
| GET | `verify-email/?token=` | – | throttle `email_verification` |
| POST | `resend-verification/` | token | throttle `resend_verification` |
| POST | `password-reset/` | – | `{email}`; generic response. Throttle `password_reset` |
| POST | `password-reset/confirm/` | – | `{uid, token, new_password}`; validates password, invalidates tokens |

## Authenticated customer endpoints

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/transport-requests/my-requests/` | the caller's own requests |
| GET | `/api/notifications/me/` | notification history + unread count |
| GET | `/api/notifications/me/unread-count/` | badge count |
| POST | `/api/notifications/me/read/` | mark read (`{ids?}`) |
| GET/PUT | `/api/notifications/preferences/` | notification preferences |

## Admin endpoints (`/api/admin/`, require admin/staff token)

| Method | Path | Notes |
|--------|------|-------|
| GET | `dashboard/` | dashboard stats |
| GET/POST | `requests/` | list (filter/search/paginate) / — |
| GET/PATCH | `requests/{id}/` | detail / update |
| PATCH | `requests/{id}/status/` | status transition (validated) → fires notification |
| POST | `requests/bulk/` | bulk status update |
| GET | `requests/export/csv/` | CSV export |
| GET/POST, GET/PATCH/DELETE | `services/`, `services/{id}/` | catalog CRUD (`active`, `sort_order`) |
| GET/POST, GET/PATCH/DELETE | `prices/`, `prices/{id}/` | price CRUD (`active`, `valid_from/until`) |
| GET/POST, GET/PATCH/DELETE | `pickup-schedules/`, `…/{id}/` | schedule CRUD (`region_name`, `active`) |
| GET | `pickup-schedules/export/csv/`, POST `…/import/` | CSV export / import |
| GET/POST, GET/PATCH/DELETE | `loading-dates/`, `…/{id}/` | loading-date CRUD (`active`) |
| POST | `broadcast/` | send a push/in-app broadcast (async) |

## TransportRequest status machine

Labels are translated (`STATUS_CHOICES`); transitions enforced server-side by
`apps/logistics/status.py` (`ALLOWED_STATUS_TRANSITIONS`):

```
new -> contacted -> confirmed -> pickup_scheduled -> received
    -> loaded -> in_transit -> arrived_cameroon -> delivered
(any non-terminal state -> cancelled)
```

`delivered` and `cancelled` are terminal. An illegal transition returns `400`.
Every change is recorded in the audit log (actor + `status_from`/`status_to`).
