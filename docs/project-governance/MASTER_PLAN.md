# MASTER_PLAN — living plan

Обновлён: **2026-07-29 03:18 ART**. Exact WP-004 preview появился и прошёл remote fail-closed/browser proof. Build-account блокер снят; data plane и Vercel runtime-log scope сохраняют приоритет перед inventory.

## Правило выбора пакета

`safety/data loss → production availability → truth/false 404 → critical journey → data integrity → admin → UX/perf → growth → new features`.

## Текущий порядок

| Order | Work packet | Severity | Exit evidence | State |
|---:|---|---|---|---|
| 0 | Restore canonical Supabase REST; diagnose deployed direct PG | P0 | all required health checks 200; incident timeline; no secret exposure | REST root cause confirmed: egress quota; owner action required. Direct-PG prod-only failure unresolved |
| 1 | Reconcile 107-file journal, checksums, RLS, grants and backup posture | P0/P1 | canonical read-only parity + advisors + backup/restore decision | blocked by Supabase scope/data plane |
| 2 | Restore Vercel deployment and project evidence | P1 | successful exact-SHA deployment + immutable URL + runtime logs | build/URL done: `189684fa` → `NnmUYR…`; read-only project/runtime-log scope still blocked |
| 3 | Fail-closed catalog resolution (WP-001) | P1 | outage→503/LKG; confirmed empty→200; confirmed missing→404; tests/build/browser | implemented, committed, pushed; Vercel deployment `2P6Pnq…` built, remote browser access blocked |
| 4 | Capability-driven public copy (WP-002) | P1 | locale/source contract + build + desktop/mobile browser + exact deployment | implemented, committed, pushed; `4c209069` deployed as `D9WetK…`; final `ef447d8e` deployment blocked |
| 5 | Clean release-candidate integration | P1 | WP commits on controlled ancestry; no unrelated dirty state; reproducible SHA | done: `a07327db`, no conflicts, clean worktree, 54 focused/evidence tests pass |
| 6 | Remote preview full-flow verification | P1 | catalog/detail/card/CTA crawl, no-JS/slow path, smoke bound to deployment | fail-closed + WP-004 desktop/mobile proven on `NnmUYR…`; commercial flow blocked by data plane |
| 7 | Production promote and post-deploy proof | P0/P1 | same artifact ID/SHA, health, rollback, catalog/detail parity | forbidden until orders 0–2 close |
| 8 | Analytics/consent/conversion proof | P1 | healthy SHA-bound report + clean-browser consent matrix | code binding improved; production proof pending healthy deployment |
| 9 | Route/interaction/data inventory regeneration | P1/P2 | current owners, states, coverage and evidence links | next independent packet |
| 10 | Remove marketplace from editorial guide critical path (WP-003) | P2 | source predicate + tests + exact build + cold benchmark + browser | done: `b53daadd`; safety 3.797→0.399 s, yazyk 2.545→0.057 s |
| 11 | Stream/fail-soft optional guide `tour-embed` (WP-004) | P2 | main editorial response independent; widget preserves unavailable vs empty semantics | done: `189684fa` / deployment `NnmUYR…`; local + immutable preview evidence pass |

## Выполненные безопасные пакеты

### WP-001 — fail-closed catalog resolution

Typed result boundaries preserve `unavailable` instead of collapsing failures to absence. APIs, RSC/UI, LKG and evidence producers now distinguish outage, confirmed empty and confirmed missing. No schema, partner write or checkout behavior changed.

### WP-002 — product truth

Global and high-risk route copy now derives from proven current behavior: GoArgentina may accept an internal request or hand off to a partner, and the card/seller owns the applicable payment/cancellation rules. Unsupported blanket promises were removed across RU/EN/ES/PT and protected with source/locale tests.

### WP-003 — editorial guide critical path

Guide pillar SSR now loads marketplace data only when the content schema actually renders a configured `tour-embed`. Static editorial pages no longer trigger full catalog aggregation and N detail resolutions; the tour widget retains strict detail validation.

### WP-004 — optional guide widget boundary

The real weather `tour-embed` now receives a catalog promise inside a local Suspense boundary. The guide streams independently; confirmed empty remains empty, while a total operational detail failure becomes a visible local unavailable state. Current partial-source production-equivalent behavior omits an unmatched optional offer without damaging the editorial parent.

## Почему порядок изменён

- WP-002 moved ahead of infrastructure-blocked work because it was reversible, testable and removed active trust/legal exposure without touching broken data paths.
- Candidate promotion remains below Vercel account recovery: exact clean SHA `a07327db` was rejected and a locally proven SHA without a deploy ID is not a remote preview.
- Safety guide latency is resolved in the clean candidate; the remaining optional weather tour widget is separated as its own bounded packet.
- Browser evidence exposed a second root cause after the first implementation: public-detail filtering discarded `unavailable` rows into `[]`. The plan kept WP-004 open until a strict optional-widget resolver and fault test proved `unavailable ≠ empty`.
- With WP-004 closed locally, route/interaction/data inventory moves ahead of new UX/growth work because current historical inventories do not describe the 2026-07 candidate surface.
- The delayed Vercel status changed the order again: remote preview proof moved ahead of inventory as soon as `189684fa` received deployment `NnmUYR…`. Promotion remains forbidden because the same preview proves REST and direct PG down.
- No growth or new feature work is allowed while production health, migration parity, recoverability and exact deployment evidence remain open.
