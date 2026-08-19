# Data ownership matrix — Iteration 3

| Entity | Canonical store | Writer | Readers | External source | Competing SSOT |
|---|---|---|---|---|---|
| KB article | markdown / collector + CMS overlay | CMS overlay + repo files | public resolver, search | — | Isolated: overlay must not silently replace files until cutover |
| Blog | typed/file + CMS overlay | CMS | public catalog/detail | — | Cutover flag false |
| Guide | typed/file + CMS overlay | CMS | public | — | Cutover flag false |
| Destination | structured + CMS | CMS | public | — | Cutover flag false |
| Place | geo dataset + optional CMS | CMS / geo | public / map | — | ADR still required for single path |
| Landing | typed/file + CMS overlay | CMS | public | — | No cutover flag |
| Platform tour | `tours` | organizer RPC / admin RPC | public listings, CRM | — | Seed store is local cabinet only |
| Partner offer | partner tables + quality gate | import/sync | public catalog if publishable | Tripster / YouTravel / Sputnik8 | Quality gate is derived; editorial overlay overrideable |
| Organizer application | `organizer_applications` | applicant insert; admin RPC | admin queue; own GET | — | Contact form no longer writes this kind |
| Organizer profile | `profiles` + public catalog | organizer/admin | public if approved | — | `organizer_verified_at` set on approve |
| Booking request (native) | `bookings` | public/auth booking API | tourist / organizer owner / admin | — | State machine |
| Contact lead | `contact_submissions` | `/api/contact` | CRM | — | Not organizer applications |
| Newsletter | `newsletter_subscribers` | `/api/newsletter` | CRM | — | Unsubscribe required |
| Redirect | `url_redirects` + next.config archives | admin | public | — | KB archive JSON is explicit legacy |
| Audit | `admin_audit_log` | RPCs + `writeAdminAuditLog` | admin | — | Append-oriented |
| Search index | CMS search outbox + static index | publish/unpublish settle | public search | — | Unpublish must drop CMS intent |

## Field ownership — partner offers

See `src/lib/admin/partner-operations.ts`. Provider-owned: price, dates, booking URL. Overrideable: title, description, image, destination. Derived: slug, quality state.

## Constraints added this iteration

- `20260819093000_lock_organizer_application_decisions.sql` — drop staff UPDATE policy; revoke UPDATE from `anon`/`authenticated`.
- No production-only SQL. Apply via migration journal when the data plane is reachable.
