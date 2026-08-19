# RBAC permission matrix — Iteration 3

Server authorization + RLS intent. Live RLS replay is `BLOCKED_EXTERNAL`.

| Capability | Anonymous | User | Organizer | Staff | Admin |
|---|---|---|---|---|---|
| Public content | read published | same | same | same | same |
| Own profile | — | own | own | own | own |
| Organizer tools | — | — | own tours/bookings via `owner_user_id` | as capability | yes |
| CMS | — | — | none | `content.edit` / `content.publish` | yes |
| CRM leads | — | — | own booking subset only | `operations.leads` | yes |
| Users | — | — | — | limited `users.manage` | yes |
| Roles / staff | — | — | — | limited | yes |
| Audit log | — | — | — | limited | yes |
| Organizer self-approve | — | — | blocked (RPC + capability) | `marketplace.moderation` | yes |
| Foreign tour IDOR | — | — | 404, no existence leak | n/a | admin RPC |
| Seed catalog as ACL | — | — | **removed from server APIs** | n/a | n/a |
| Application UPDATE | — | insert/select own | select own | **revoked**; RPC only | service-role RPC |
| Dormant shop/forum writes | quarantined | quarantined | quarantined | admin retained | admin retained |
| Own payment write in production | gated | gated | gated | gated | gated `productionEnabled:false` |

## IDOR tests (source)

- Draft GET/PATCH/DELETE: missing and foreign → 404.
- `assertOrganizerTourOwnership`: missing and foreign → 404.
- Bookings / inbox / reviews / notifications / trip-prep / refund / commission: slugs from `tours.owner_user_id` only.
- `organizerCanAccessBooking` no longer defaults to seed listings.

## Session

Role changes still require the existing staff/identity RPCs. After role revoke, new requests load capabilities from staff/profile — old UI hide is insufficient; APIs re-check `authorizeAdminRequest`.
