# Iteration 3 — Admin, CMS, CRM, organizer, data ownership

Generated: 2026-08-19  
Agent branch: `cursor/iteration3-operations-5475`  
Canonical production: https://www.goargentina.ru

## 1. Executive verdict

**CONDITIONAL**

Internal **code contracts** now match a workable operating system: CMS publish/unpublish invalidates public caches; organizer applications cannot hide in the contact inbox; staff cannot UPDATE applications outside the RPC; CRM lead statuses are constrained and audited; organizer server APIs no longer treat seed catalog slugs as ACL.

Live persist, live RLS, and production CMS/organizer/CRM E2E remain **NOT_PROVEN** because Iteration 1 blockers are unchanged: REST 402 `exceed_egress_quota`, IPv6-only Postgres, Vercel account blocked.

Paid traffic: **NO-GO**.

## 2. Regression status Iteration 1

| Check | Result |
|---|---|
| I1 report | Present |
| `origin/main` | `81055b1387e0062301ca9c0ae7468cbf782e2511` |
| Production `gitSha` | Same SHA |
| `/api/health` | **503 down** |
| I1 code rolled back? | No |
| Live blockers cleared? | No — `BLOCKED_EXTERNAL` |

## 3. Regression status Iteration 2

I2 branch `cursor/iteration2-public-product-5475` is the parent of this work. Marketplace date gate, partner garbage filter, visa archive redirect, dormant nav/search fail-closed are in ancestry. **Not live** until deploy.

## 4. Admin

Dashboard and operations hub now surface:

- pending moderation
- pending organizer applications
- leads last 24h
- CMS drafts / scheduled
- partner sync stale/down
- payments (still POST_LAUNCH gated)

Partner feed health is visible on operations, not only settings.

## 5. CMS

| Type | List/edit/save | Publish | Unpublish | Public source | Live E2E |
|---|---|---|---|---|---|
| Knowledge | yes | quality gate | dedicated helper | overlay + files | NOT_PROVEN |
| Blog | yes | yes | yes | overlay + typed | NOT_PROVEN |
| Guide | yes | yes | yes | overlay + typed | NOT_PROVEN |
| Places | yes | yes | yes | geo + overlay | NOT_PROVEN |
| Destinations | yes | yes | yes | overlay + structured | NOT_PROVEN |
| Landing | yes | yes | yes | overlay + typed | NOT_PROVEN |

Cutover flags remain **false**. Governance panel is wired for knowledge documents.

## 6. Organizer

Application persist + 409 + own GET + admin RPC + reject in-app notify + ownership 404 + DB slugs for server ACL. Public `/organizers/[slug]` still uses static catalog (unchanged product contract; not a silent CMS cutover).

## 7. CRM / booking requests

Contact persist path unchanged except organizer kind rejected. Lead PATCH: transition matrix + audit. Native bookings keep existing state machine. Organizer booking access no longer seed-based.

## 8. Marketplace operations

Quality gate from I2 is the quarantine implementation. Admin can see provider freshness and the ownership contract. Live sync idempotency `NOT_PROVEN`.

## 9. RBAC / RLS

Source/IDOR contracts added. New migration revokes application UPDATE. Live RLS after migration: `BLOCKED_EXTERNAL`.

## 10. Data ownership

See `DATA_OWNERSHIP_MATRIX.md`. Competing SSOT isolated, not mass-merged.

## 11. Database changes

`supabase/migrations/20260819093000_lock_organizer_application_decisions.sql`

Rollback thinking: restore the staff UPDATE policy only if a documented break-glass is required; preferred path is always the RPC.

Production apply: **not executed** (data plane down). Must ride the normal journal when quota/pooler recover. No manual SQL editor step.

## 12. Tests

Targeted Iteration 3 contracts plus `npm run audit:quick` (see final agent summary after run).

## 13. Production

| Item | Value |
|---|---|
| Production SHA | `81055b1387e0062301ca9c0ae7468cbf782e2511` |
| Deploy of I3 | Blocked — Vercel account |
| Health | 503 |

## 14. Remaining blockers

1. Supabase `exceed_egress_quota` on `uooxrypocahomoqzdvzy`.
2. IPv4 session pooler URL on Vercel.
3. Unblock Vercel team `go-argentina`.

## 15. Iteration 4 readiness

**CONDITIONAL GO** — code for operations is ready to certify after data plane + deploy. Do not start paid traffic or claim live CMS/CRM proof until then.
