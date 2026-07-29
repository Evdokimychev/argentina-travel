# MASTER_PLAN — living plan

Обновлён: **2026-07-29 05:17 ART**. WP-009 закрыл terminal-state regression из-за post-completion notification и добавил CAS для `processing → completed/failed`; DB-level uniqueness, durable audit и live processor effect остаются выше UX/growth.

## Правило выбора пакета

`safety/data loss → production availability → truth/false 404 → critical journey → data integrity → admin → UX/perf → growth → new features`.

## Текущий порядок

| Order | Work packet | Severity | Exit evidence | State |
|---:|---|---|---|---|
| 0 | Restore canonical Supabase REST; diagnose deployed direct PG | P0 | all required health checks 200; incident timeline; no secret exposure | REST root cause confirmed: egress quota; owner action required. Direct-PG prod-only failure unresolved |
| 1 | Reconcile 107-file journal, checksums, RLS, grants and backup posture | P0/P1 | canonical read-only parity + advisors + backup/restore decision | blocked by Supabase scope/data plane |
| 2 | Restore Vercel deployment and project evidence | P1 | successful exact-SHA deployment + immutable URL + runtime logs | current `34c05f55` → `CKfpUHhx…`; repeated delayed recovery remains volatile and logs still blocked |
| 3 | Fail-closed catalog resolution (WP-001) | P1 | outage→503/LKG; confirmed empty→200; confirmed missing→404; tests/build/browser | implemented, committed, pushed; Vercel deployment `2P6Pnq…` built, remote browser access blocked |
| 4 | Capability-driven public copy (WP-002) | P1 | locale/source contract + build + desktop/mobile browser + exact deployment | implemented, committed, pushed; `4c209069` deployed as `D9WetK…`; final `ef447d8e` deployment blocked |
| 5 | Clean release-candidate integration | P1 | WP commits on controlled ancestry; no unrelated dirty state; reproducible SHA | done: `a07327db`, no conflicts, clean worktree, 54 focused/evidence tests pass |
| 6 | Remote preview full-flow verification | P1 | catalog/detail/card/CTA crawl, no-JS/slow path, smoke bound to deployment | fail-closed + WP-004 desktop/mobile proven on `NnmUYR…`; commercial flow blocked by data plane |
| 7 | Production promote and post-deploy proof | P0/P1 | same artifact ID/SHA, health, rollback, catalog/detail parity | forbidden until orders 0–2 close |
| 8 | Analytics/consent/conversion proof | P1 | healthy SHA-bound report + clean-browser consent matrix | code binding improved; production proof pending healthy deployment |
| 9 | Route/interaction/data inventory regeneration (WP-005) | P1/P2 | deterministic current surface, stable IDs, source lines, stale gate | done: `91be7962` / `6Y9E1p…`; 471 routes, 470 data rows, 2 298 interactions |
| 10 | Critical interaction effect/evidence coverage (WP-006) | P1/P2 | explicit manifest for booking/payment/profile/admin effects; source-only ≠ tested | done: `d07f48c8` / `8QR63F…`; 11 journeys, 8 contract-tested, 3 source-only; remote browser pass, smoke correctly blocked by health |
| 11 | Privacy transition atomicity and route contracts (WP-007) | P1 | compare-and-set transition; scoped export/delete/admin tests; no real deletion | done `cad6aa35` / `ApSwUC4…`; 8 route tests + full audit/build/local+remote browser pass; smoke correctly blocked by data plane |
| 12 | Privacy deletion recovery/idempotency contracts (WP-008) | P1 | retry identity survives partial anonymization; no production mutation | done `e4c1dad5` / `B3yBJST…`; focused 11 + full 2 016 tests/build/local+remote browser pass; smoke blocked by data plane |
| 13 | Privacy processor partial-failure contract (WP-009) | P1 | terminal-state CAS; post-completion notification cannot regress deletion; no live mutation | done `34c05f55` / `CKfpUHhx…`; 14 focused + full 2 019 tests/build/local+remote browser pass; smoke blocked by data plane |
| 14 | Booking/payment route integration packet (WP-010) | P0 | fake-provider route tests for token/state/replay/provider failure; no real payment | next safe packet while DB/live privacy work is infrastructure-blocked |
| 15 | Remove marketplace from editorial guide critical path (WP-003) | P2 | source predicate + tests + exact build + cold benchmark + browser | done: `b53daadd`; safety 3.797→0.399 s, yazyk 2.545→0.057 s |
| 16 | Stream/fail-soft optional guide `tour-embed` (WP-004) | P2 | main editorial response independent; widget preserves unavailable vs empty semantics | done: `189684fa` / deployment `NnmUYR…`; local + immutable preview evidence pass |

## Выполненные безопасные пакеты

### WP-001 — fail-closed catalog resolution

Typed result boundaries preserve `unavailable` instead of collapsing failures to absence. APIs, RSC/UI, LKG and evidence producers now distinguish outage, confirmed empty and confirmed missing. No schema, partner write or checkout behavior changed.

### WP-002 — product truth

Global and high-risk route copy now derives from proven current behavior: GoArgentina may accept an internal request or hand off to a partner, and the card/seller owns the applicable payment/cancellation rules. Unsupported blanket promises were removed across RU/EN/ES/PT and protected with source/locale tests.

### WP-003 — editorial guide critical path

Guide pillar SSR now loads marketplace data only when the content schema actually renders a configured `tour-embed`. Static editorial pages no longer trigger full catalog aggregation and N detail resolutions; the tour widget retains strict detail validation.

### WP-004 — optional guide widget boundary

The real weather `tour-embed` now receives a catalog promise inside a local Suspense boundary. The guide streams independently; confirmed empty remains empty, while a total operational detail failure becomes a visible local unavailable state. Current partial-source production-equivalent behavior omits an unmatched optional offer without damaging the editorial parent.

### WP-005 — reproducible product surface inventory

The repository now deterministically generates the current route, route/data and UI-interaction surface from TypeScript/JS AST plus local imports. Source facts carry stable IDs and line/column evidence; live database, RLS, backend effects and test coverage remain explicitly unknown. Staleness is blocking in both `audit:quick` and the CI release gate.

### WP-006 — critical interaction evidence

A reviewed manifest now maps 11 P0/P1 journeys from UI through client request and exported route handler to expected effects, guards, invariants and exact test titles. The generator validates dependency reachability and source/test anchors. Eight journeys are `contract_tested`; privacy export, deletion request and admin transition remain explicitly `source_only`, and all live effects remain `unknown_db_down`.

### WP-007 — privacy route integrity

Privacy export and deletion-request orchestration now have authenticated route contracts. Admin approval/rejection uses status compare-and-set, rejects transitions after approval/processing, records actor metadata in the same request-row update and leaves profile deletion to the cron processor. A lost race returns 409 before audit. All 11 critical journeys now have at least unit or route-integration evidence; live effects remain unknown.

### WP-008 — privacy retry identity preservation

The deletion processor now resolves the original email/name from request metadata when a previous partial run has already nulled/anonymized the profile, while current pre-anonymization profile identity still wins. Fault-oriented unit contracts cover both branches and completed metadata remains PII-free. This closes the demonstrated identity-loss retry bug, but does not make the multi-system processor transactional or prove live deletion.

### WP-009 — privacy terminal-state monotonicity

`processing → completed` and `processing → failed` now use status compare-and-set. Completion notification runs only after the destructive operation and terminal completion succeed; provider failure is logged as best-effort and cannot regress a completed request to failed. Automatic retry of `failed` remains intentionally disabled: admin re-approval is the bounded manual recovery path until leases/backoff/dead-letter and DB parity exist.

## Почему порядок изменён

- WP-002 moved ahead of infrastructure-blocked work because it was reversible, testable and removed active trust/legal exposure without touching broken data paths.
- Candidate promotion remains below Vercel account recovery: exact clean SHA `a07327db` was rejected and a locally proven SHA without a deploy ID is not a remote preview.
- Safety guide latency is resolved in the clean candidate; the remaining optional weather tour widget is separated as its own bounded packet.
- Browser evidence exposed a second root cause after the first implementation: public-detail filtering discarded `unavailable` rows into `[]`. The plan kept WP-004 open until a strict optional-widget resolver and fault test proved `unavailable ≠ empty`.
- With WP-004 closed locally, route/interaction/data inventory moves ahead of new UX/growth work because current historical inventories do not describe the 2026-07 candidate surface.
- The delayed Vercel status changed the order again: remote preview proof moved ahead of inventory as soon as `189684fa` received deployment `NnmUYR…`. Promotion remains forbidden because the same preview proves REST and direct PG down.
- WP-005 found the historical inventory was structurally stale (129 recorded pages versus 157 current pages and 234 recorded handlers versus 312 current handlers). This moved deterministic regeneration ahead of any new UX work.
- The generated interaction ledger contains 2 298 technical surfaces but intentionally labels all as `source_only`; therefore WP-006 now targets effect/test evidence for critical mutations rather than adding functionality.
- `91be7962` briefly failed with `Account is blocked` and then deployed as `6Y9E1p…`; deployment access remains volatile even though the current exact preview is valid.
- WP-006 proved that blanket `source_only` was a traceability gap, not proof that every critical action lacked tests: 8/11 journeys already had source-bound unit contracts. The remaining 3/11 are privacy paths, so WP-007 moves ahead of UX/growth work.
- The admin privacy transition performs read then update without a status compare-and-set and enqueues audit logging outside the database mutation. This evidence moves atomic privacy transition and route contracts to the highest independent engineering packet while live migration work remains forbidden.
- Exact `d07f48c8` first failed with `Account is blocked`, then recovered after nine minutes as deployment `8QR63FhdmjYAfbgQiKPx8vQ9DgnM`. Exact remote health/browser evidence passes; smoke exits at the mandatory unhealthy data-plane gate.
- WP-007 source review found that admin reject could overwrite an already `processing` request and the transition update matched only ID. CAS plus strict state guards are now local-proven; premature profile soft-delete was removed from approval because the actual processor owns auth/profile/data mutation.
- The user deletion-request route still uses read-then-insert without a live-verified partial unique constraint, and `admin_audit_log` remains best-effort outside the request-row update. These residual DB guarantees require migration parity before any DDL/RPC.
- The deletion processor is multi-step and non-transactional. WP-008 therefore tests retry/idempotency and partial-failure semantics before any new schema or production mutation.
- WP-008 source trace found a concrete retry bug: after profile anonymization, a later failure caused the next run to lose the original email needed for email-linked cleanup because it reread only the anonymized profile. Request metadata already durably retained that identity until completion, so a deterministic fallback is the smallest safe repair.
- `cad6aa35` recovered 12 minutes after its first Vercel failure and is remotely proven as deployment `ApSwUC4F1qfgwMAjkKqRELUSojuY`; the same preview remains correctly blocked at the unhealthy data-plane gate. Exact `e4c1dad5` is locally proven but Vercel returned `Account is blocked` and created no deployment, so WP-009 proceeds without treating WP-007 preview as WP-008 evidence.
- `e4c1dad5` later recovered as deployment `B3yBJSTtcerPqeYJwKpWwR3vxj3T`; exact remote health/browser bind that SHA and smoke still blocks promotion. WP-009 source review then exposed a separate regression path: completion email lived inside the destructive catch boundary and failure marking matched only request ID.
- After WP-009, remaining privacy guarantees require canonical DB parity or a controlled disposable database. The next independent high-risk packet moves to P0 booking/payment route integration rather than inventing unsafe auto-retry or applying unverified DDL.
- No growth or new feature work is allowed while production health, migration parity, recoverability and exact deployment evidence remain open.
