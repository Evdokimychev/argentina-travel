# Organizer flow evidence — Iteration 3

## State model (existing, not a new enum)

Application table: `pending | approved | rejected`.

Cabinet access: `profiles.roles` includes `organizer`, granted only by `admin_decide_organizer_application` (also sets `organizer_verified_at`).

Product states for own offers: draft / submitted (`moderation_status`) / published / archived.

## Lifecycle

1. Authenticated user POSTs `/api/organizer-applications` → row in `organizer_applications`.
2. Duplicate pending → 409 (pre-check + unique index `23505`).
3. GET `/api/organizer-applications` returns own latest application (no review internals).
4. `/api/contact` with `organizer_application` → 400 `USE_ORGANIZER_APPLICATIONS` (no CRM impersonation of this flow).
5. Admin PATCH approve/reject via RPC only. Staff table UPDATE policy dropped.
6. After commit: in-app notification for **both** approve and reject; email via existing templates.
7. Organizer mutates only own `tours` (`owner_user_id`). Foreign/missing IDs → 404.
8. Server booking/inbox/reviews/notifications use DB-owned slugs, not seed catalog.

## Permissions

Organizer cannot approve self, read another organizer’s drafts, or call admin APIs. Suspended/rejected without role cannot open cabinet (existing role gate).

## Live E2E

`NOT_PROVEN` on production (auth/DB 503). Source + unit contracts cover IDOR, 409, reject notify, RPC-only decisions.
