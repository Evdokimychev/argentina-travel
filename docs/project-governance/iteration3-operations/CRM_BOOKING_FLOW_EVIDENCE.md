# CRM / booking request evidence — Iteration 3

## Two inboxes (intentional)

| Channel | Table | Public writer | Admin tool | Status model |
|---|---|---|---|---|
| Contact / leads | `contact_submissions` | `/api/contact` | `/admin/operations/leads` | `new → in_progress → waiting → resolved`; `spam`; reopen only `resolved→in_progress`, `spam→new` |
| Native booking request | `bookings` | booking APIs | `/admin/operations/bookings` | `booking-state-machine.ts` (unchanged) |
| Partner handoff | partner request tables | partner checkout | health / quality gate | Not a second OTA |

Email is **not** the persistence layer. Contact persist goes through `submitContact`. Organizer applications are **not** contact rows.

## Lead PATCH

- Loads current row.
- Rejects illegal transitions with 409 `INVALID_STATUS_TRANSITION`.
- Writes `admin_audit_log` `crm.lead.update` (from/to status, note/next-action flags; no raw PII in payload).

## Booking

Native bookings already use atomic RPC + actor-limited transitions. Organizer access on server now requires `organizer_user_id` or a slug from `tours.owner_user_id`.

## Notifications

Existing lead capture notify remains. Organizer application notify covers reject. Live send is `NOT_PROVEN` while email/DB are down.

## Live E2E

Public form → DB → CRM → status → audit: **code-complete, production persist NOT_PROVEN**.
