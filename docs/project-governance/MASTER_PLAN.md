# MASTER_PLAN — living plan

Обновлён: **2026-07-29 08:57 ART**. WP-014 ограничил booking-create response идентификатором, связал replay с guest/session actor и получил exact immutable preview; live RPC/RLS/attach effect и SQL-layer hardening остаются заблокированы migration parity.

## Правило выбора пакета

`safety/data loss → production availability → truth/false 404 → critical journey → data integrity → admin → UX/perf → growth → new features`.

## Текущий порядок

| Order | Work packet | Severity | Exit evidence | State |
|---:|---|---|---|---|
| 0 | Restore canonical Supabase REST; diagnose deployed direct PG | P0 | all required health checks 200; incident timeline; no secret exposure | REST root cause confirmed: egress quota; owner action required. Direct-PG prod-only failure unresolved |
| 1 | Reconcile 107-file journal, checksums, RLS, grants and backup posture | P0/P1 | canonical read-only parity + advisors + backup/restore decision | blocked by Supabase scope/data plane |
| 2 | Restore Vercel deployment and project evidence | P1 | successful exact-SHA deployment + immutable URL + runtime logs | final `26aeda4c` recovered after ~9 min as `7w7fLVQJZzod562BUBKVxN1XACUo`; build remains volatile and logs/scope blocked |
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
| 14 | Booking/payment route integration packet (WP-010) | P0 | fake-provider route tests for token/state/race/provider failure/status projection; no real payment | done `beb236fb` + `179d3e51` / `4aRm8X7Q…`; 21 focused + 2 031 full tests, exact build/local+remote browser; smoke correctly blocked by health |
| 15 | Booking creation route integration (WP-011) | P0 | App Router + fake atomic command: canonical pricing, idempotency, slot conflict, safe failure; no live booking | done `84988cf` / `8aKBjCN2…`; 14 focused + 2 040 full tests, exact build/journey/local+remote browser; smoke correctly blocked by health |
| 16 | Payment webhook ledger recovery (WP-012) | P0 | signed App Router delivery; durable ledger before 2xx; retry/replay recovery; out-of-order state; safe failure with fake provider/store | done `77cf5674` / `13SV9J…`; 33 focused + 2 053 full + build/journey/local+remote browser; live DB/provider effects unknown |
| 17 | Refund request/approval route integrity (WP-013) | P0 | authenticated App Router tests; actor/ownership; operation-id replay; cumulative cap/race; no provider execution | done `26aeda4c` / `7w7fLVQ…`; 21 focused + 2 063 full + exact build/local+remote browser/smoke; live DB/provider/recovery unknown |
| 18 | Booking replay capability/actor binding (WP-014) | P1 | bounded replay response; guest/session ownership matrix; leaked idempotency key cannot expose canonical CRM booking | done `32038cc9` + exact `84f6244b` / `CJ3fcfursTMefpDtXoJRX7h1TpmN`; 21 focused + 2 070 full + local/remote browser/smoke |
| 19 | Refund `processing` reconciliation (WP-015) | P0/P1 | provider lookup; same durable key; atomic recovery lease; finalize/audit; no blind retry | next financial packet after live journal/provider capability evidence; R-024 remains active |
| 20 | Remove marketplace from editorial guide critical path (WP-003) | P2 | source predicate + tests + exact build + cold benchmark + browser | done: `b53daadd`; safety 3.797→0.399 s, yazyk 2.545→0.057 s |
| 21 | Stream/fail-soft optional guide `tour-embed` (WP-004) | P2 | main editorial response independent; widget preserves unavailable vs empty semantics | done: `189684fa` / deployment `NnmUYR…`; local + immutable preview evidence pass |

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

Privacy export and deletion-request orchestration now have authenticated route contracts. Admin approval/rejection uses status compare-and-set, rejects transitions after approval/processing, records actor metadata in the same request-row update and leaves profile deletion to the cron processor. A lost race returns 409 before audit. На снимке WP-007 все тогда учтённые 11 critical journeys имели как минимум unit или route-integration evidence; live effects оставались unknown.

### WP-008 — privacy retry identity preservation

The deletion processor now resolves the original email/name from request metadata when a previous partial run has already nulled/anonymized the profile, while current pre-anonymization profile identity still wins. Fault-oriented unit contracts cover both branches and completed metadata remains PII-free. This closes the demonstrated identity-loss retry bug, but does not make the multi-system processor transactional or prove live deletion.

### WP-009 — privacy terminal-state monotonicity

`processing → completed` and `processing → failed` now use status compare-and-set. Completion notification runs only after the destructive operation and terminal completion succeed; provider failure is logged as best-effort and cannot regress a completed request to failed. Automatic retry of `failed` remains intentionally disabled: admin re-approval is the bounded manual recovery path until leases/backoff/dead-letter and DB parity exist.

### WP-010 — payment checkout route integrity

Stripe and Mercado Pago checkout initiation now claims the payment link's first online provider through the existing booking version CAS before any external call, then CAS-persists the provider result. Cross-provider races create only one external checkout in the fake-provider route integration; stale webhook/admin state wins over checkout persistence. Provider callbacks use canonical site URL behavior, public errors contain no provider/storage details, and the payment-link status endpoint exposes only the checkout fields required by the two payment pages. No schema, live payment, webhook or production data mutation was performed.

### WP-011 — native booking creation integrity

The App Router booking handler now derives reservation eligibility server-side. A price quote may persist a lead but cannot consume a slot; a real scheduled booking must confirm its canonical slot before the atomic command or fail with 409 and zero persistence/notification effects. Route tests cover canonical commercial fields, idempotent replay, changed-fingerprint conflict, slot conflict, quote behavior, guard failures and public-safe unknown storage errors. No migration, live booking, notification delivery or production mutation was performed.

### WP-012 — payment webhook ledger integrity

Signed Stripe and Mercado Pago routes now use a detailed booking outcome and require a durable charge row before 2xx. Retryable booking/ledger failures return 500; an exact event replay attempts ledger repair and emits a notification only when that repair inserts the first charge row. Charge persistence is insert-first against the existing provider/external-ID uniqueness boundary, rejects cross-booking identity reuse and refuses delayed state regression. Mercado requires the notification ID separately from the payment resource ID. No DDL or live webhook/payment mutation was performed; commission/outbox and live PostgREST/RLS behavior remain explicit gaps.

### WP-013 — refund request/approval route integrity

Refund preparation now derives money from the completed source charge instead of client/booking USD fields, rejects currency/provider mismatch, and returns an identical UUID replay without another reservation. Tourist POST uses shared booking ownership, so matching contact email alone cannot mutate finance; organizer/admin paths retain explicit role/capability and personal-session gates. Approve/reject responses no longer expose raw provider or SQL failures, and ledger UI renders the stored currency directly. Existing SQL still owns charge locking, cumulative cap, active-request uniqueness and four-eyes claim. No migration or live provider/refund mutation was performed; uncertain `processing` recovery remains a separately registered risk.

### WP-014 — booking replay actor and response integrity

The public booking-create handler no longer serializes the canonical CRM row: first creation and exact replay return the same ID-only receipt. The service wrapper rejects a stored booking whose owner differs from the new canonical actor even when the operation key and command fingerprint match. Anonymous replay remains bound to the deterministic guest identity; a signed-in user may transition guest→account only through the existing confirmed-email attach RPC before replay. Client types now reflect the minimal receipt. No migration was added while the 107-file live journal is unreadable; the service-role SQL function still returns its internal row to the single wrapper and remains an explicit DB-layer hardening/evidence gap.

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
- WP-010 reproduction changed the payment plan: a blind post-provider CAS alone would still allow Stripe and Mercado Pago to create one checkout each. The existing payment-link gateway field is therefore claimed with CAS before the provider boundary; a different provider is rejected, while same-provider recovery keeps its durable idempotency key.
- Local production smoke exposed a second P0 in the same journey: the public status route leaked `supabaseKey is required` and the full booking payload, including CRM/traveler fields. WP-010 remained open until safe errors and a bounded checkout projection were route-tested.
- An initial exact-SHA preview accidentally served stale `.next-production` because Vercel env made the build use `.next`. That result was rejected; final evidence explicitly binds `NEXT_DIST_DIR=.next-production` and `179d3e51`.
- WP-011 reproduction showed that `priceQuoteRequest: true` reached the same unconditional availability bootstrap/atomic RPC as a real booking, so requesting a quote incremented `booked_count`. The same route ignored a false slot-bootstrap result, allowing a scheduled booking to persist without confirmed inventory. These demonstrated data-integrity defects moved booking creation ahead of webhook work.
- WP-011 makes `reservationSlotDate` a server-owned derived field, fails closed before persistence when a required slot cannot be confirmed, and converts unknown RPC/storage failures to a generic public 503. Exact deployment `8aKBjCN2…` recovered after the initial Vercel account block; local+remote browser and smoke bind the artifact but deliberately do not execute a booking mutation.
- WP-012 source audit then found a higher-value financial-integrity defect: both signed webhook routes update booking state before writing the charge ledger, while `persistWebhookChargeTransaction` swallows every ledger error. The route returns 200, and the same event is thereafter classified as processed, so the provider retry cannot repair `payment_transactions`. This moves ledger recovery/ordering ahead of lower-risk webhook refinements.
- WP-012 implementation changes the next packet: exact replay is now a repair path, 2xx is gated by the charge row, and Mercado notification identity is mandatory. Local signed route/concurrency evidence is sufficient for candidate code, but cannot establish live partial-index inference, RLS, commission or provider delivery while Supabase is restricted.
- Exact WP-012 deployment recovered after the same transient Vercel block pattern and now binds `77cf5674` remotely. This closes artifact identity for the packet but not infrastructure stability, runtime-log access or any live payment effect.
- Strict smoke and Browser QA show the candidate shell can render recovery paths while the home/catalog enter error boundaries. Therefore no UX/growth work moves upward; the next independent P0 is existing refund request/approval route integrity, followed by booking replay actor binding.
- WP-013 reproduction found the booking USD summary was incorrectly treated as refund money, breaking ARS/non-USD charges and encouraging unsafe conversion semantics. The completed charge is now the sole money authority; email-only POST access and raw provider/SQL responses were removed in the same route boundary.
- Existing claim/finalize SQL safely prevents two initial approvers, but a provider success or timeout followed by finalize failure can leave `processing` with no lease/reconcile command. Replaying provider idempotency without an atomic recovery claim was rejected as insufficient evidence; this remains ahead of growth but behind restoration of live journal/provider lookup evidence.
- WP-014 moved active after source reproduction showed idempotent booking replay returns the full canonical booking object. It is independent of the broken data plane and can be fixed with a bounded response/actor matrix without adding schema.
- WP-014 route/service evidence now proves the full guest/session matrix and ID-only receipt. Because the SQL RPC is service-role-only and has one wrapper call site, the safe application fix ships independently; duplicating the owner predicate in SQL is deferred until migration parity rather than editing an already-applied migration or inventing unverified DDL.
- Exact `84f6244b` recovered from the recurring Vercel account block after about seven minutes as deployment `CJ3fcfursTMefpDtXoJRX7h1TpmN`. Immutable health and 16/1 browser evidence bind the SHA, but REST/direct PG remain down and strict smoke blocks promotion.
- The next financial packet is WP-015 refund `processing` reconciliation, but implementation of provider lookup and an atomic recovery lease remains behind canonical journal/provider evidence. Infrastructure recovery therefore retains orders 0–2 and no growth work moves upward.
- Exact WP-013 recovered from the recurring Vercel account block after ~9 minutes. Immutable health/browser evidence binds `26aeda4c`, but the same preview proves both REST and direct PG down; promotion remains forbidden.
- No growth or new feature work is allowed while production health, migration parity, recoverability and exact deployment evidence remain open.
