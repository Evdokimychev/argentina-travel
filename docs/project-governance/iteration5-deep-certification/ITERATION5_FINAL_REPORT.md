# Iteration 5 — Deep Product Certification

## 1. Executive verdict

**NOT CERTIFIED**

I4 NO-GO remains correct and is not enough. I5 found additional launch-relevant defects, fixed them in candidate, and still cannot certify: production data plane is down, search is 500 live, Vercel cannot deploy, backup/restore is unproven.

CERTIFIED WITH CONDITIONS is refused: leftovers are P0 infrastructure, not cosmetics.

## 2. Starting state

| Item | Value |
|------|--------|
| Date | 2026-08-19 |
| `origin/main` | `81055b1387e0062301ca9c0ae7468cbf782e2511` |
| Production `gitSha` | `81055b1387e0062301ca9c0ae7468cbf782e2511` |
| I4 RC (parent) | `5b1ceb90` on `cursor/iteration4-final-release-5475` PR `#33` |
| I4 launch decision | NO-GO (not GO — I5 did not defend a GO that was never issued) |
| Health | 503 `dependency_unavailable` |

## 3. Scope actually examined

| Surface | Count / method |
|---------|----------------|
| App Router pages | **159** (`docs/audit/route-inventory.csv`) |
| Route handlers | **314** (GET 213, POST 140, PUT 8, PATCH 39, DELETE 19, HEAD 1, OPTIONS 5) |
| Page visibility (path heuristic) | public 76, admin 51, organizer 21, authenticated 11 |
| Cron route files | **22**; Vercel scheduled **4** |
| Typed tables | **97** (`src/types/database.ts`) |
| FLAG_DESTINY flags | **9** |
| `process.env` names in src | **175** (names only) |
| Public URLs probed live | 19+ (home, catalogs, KB, blog, guide, map, contacts, search page, case/slash, admin/organizer gates, robots, sitemap, apex) |
| Adversarial API probes | contact, newsletter, search length/empty |
| I1–I4 reports + governance | read; I4 GO was never claimed |

Full tables: `MASTER_SYSTEM_INVENTORY.md`, `ROUTE_AND_API_CENSUS.md`, `DATABASE_DOMAIN_MATRIX.md`.

## 4. New defects beyond Iterations 1–4

These are the value of Iteration 5.

1. **Search hides or crashes on catalogue outage (P1).** I1/I4 typed `/tours` and `/excursions` pages. Search still did `.catch(() => ({ items: [] }))` for excursions (then dropped every excursion hit) and let `fetchMarketplaceTours()` throw. Live: `/api/search` **500 empty body**. Chrome silently fell back to the static index.
2. **CORE APIs leaked `error.message` (P1).** I4 closed rate-limit fail-open and provider log text. Client JSON on tours, auth, bookings, organizer, map, privacy, conversations, etc. still serialized unexpected exceptions.
3. **Organizer cabinet empty-on-error (P1).** `catch(() => setBookings([]))` plus onboarding when bookings.length === 0. Outage looked like «нет заявок».
4. **Doc truth drift.** `AGENTS.md` still named the I1 report as current. Trip-prep and messaging docs claimed hourly `platform-maintenance`; `vercel.json` is daily Hobby.
5. **No `/search` page (404).** Dialog-only discovery. Not a P0; recorded as IA.

Why I1–I4 missed them: page-level catalog audits, security scoped to rate limits/logs, organizer work scoped to ownership/RPC, docs updated CURRENT_STATE but not the agent entry pointer.

## 5. P0/P1 fixed (candidate)

| ID | Fix |
|----|-----|
| P1-I5-001 | Typed catalogue availability; keep hits when unavailable; SiteSearch notice |
| P1-I5-002 | `unexpectedPublicApiError()` on CORE/operator unexpected 500s + source contract |
| P1-I5-003 | Organizer load alerts; onboarding gated |
| P0-I5-001 | Not code-fixable — remains blocked_external |

## 6. Public product

Shells 200. First-time homepage copy is clear. Trust fails because catalogs 503 and search 500. Visa FAQ and `/st_location` still old-SHA (I2). Map editorial 192 objects is an acceptable geography SSOT.

## 7. Marketplace

Live listing dump: **not scannable**. APIs 503. I5 did not invent quality percentages. Discovery path was the missed marketplace defect.

## 8. Content

No mass rewrite. Visa still live 200. BNA windows were I4. Cutover flags remain false — static/reviewed overlay.

## 9. Admin / CMS / CRM / Organizer

Auth 402 — cabinets not exercisable live. CMS `expectedVersion` CAS remains (I3). I5 organizer UI no longer lies about empty queues. Persist journeys NOT_PROVEN.

## 10. Data & DB

97 typed tables assigned domains. Live RLS/journal NOT_PROVEN. Prisma 7 models are niche, not SSOT.

## 11. Security

Not weakened. RLS untouched. Unexpected client errors allowlisted. Dormant forum/shop leak-shaped catches left (quarantined). Live Auth matrix BLOCKED_EXTERNAL.

## 12. Architecture

Search no longer poisons results with a false-empty catalogue. Cron map documented. Giant files listed, not split. No shop/forum/hotels/payments/AI.

## 13. Performance

No correctness trade for speed. Search no longer 500s the whole index because tours timed out (candidate). Live search still 500 on old SHA.

## 14. Operations

Morning/editorial/marketplace/complaint/release/DB/secret/backup rehearsals: all blocked on quota, Auth, Vercel, or backup secrets. Cron daily not hourly.

## 15. Tests

Targeted I5: **11/11 PASS** (`public-catalog-results`, `safe-error`, `public-runtime-error-boundary`).

`npm run audit:quick` after inventory refresh: **498 files / 2448 tests PASS** (I4 was 498 / 2443). TypeScript and inventory check green.

## 16. Cleanup

No dead route deletion without proof. Unused npm packages not removed. Stale hourly cron docs corrected. Agent entry pointed at I5.

## 17. Final re-audit

See `FINAL_REAUDIT_REPORT.md`. Independent challenge: HTML 200 is not certification. Rechecked. NOT CERTIFIED stands.

## 18. Remaining external blockers

Same as I4: quota, IPv4 pooler, Vercel unblock, backup secrets + restore, then live RLS/persist/deploy.

## 19. Final SHA

I5 candidate: `3edefcc4793dcf522c582ff7be531f38da99ac39` on `cursor/iteration5-deep-certification-5475` (PR `#34`). Production remains `81055b13`.

## 20. Final production state

Unchanged: 503 down, search 500, catalogs 503, Vercel blocked. I5 is certification-hardening on top of I4, not a launch.
