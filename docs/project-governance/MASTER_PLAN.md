# MASTER_PLAN — living plan

Обновлён: **2026-07-29 01:31 ART**. WP-001/WP-002 перенесены на чистую ancestry от `origin/main`; Vercel отклонил exact clean SHA с `Account is blocked`. Supabase P0 и live migration evidence по-прежнему выше promotion.

## Правило выбора пакета

`safety/data loss → production availability → truth/false 404 → critical journey → data integrity → admin → UX/perf → growth → new features`.

## Текущий порядок

| Order | Work packet | Severity | Exit evidence | State |
|---:|---|---|---|---|
| 0 | Restore canonical Supabase REST; diagnose deployed direct PG | P0 | all required health checks 200; incident timeline; no secret exposure | REST root cause confirmed: egress quota; owner action required. Direct-PG prod-only failure unresolved |
| 1 | Reconcile 107-file journal, checksums, RLS, grants and backup posture | P0/P1 | canonical read-only parity + advisors + backup/restore decision | blocked by Supabase scope/data plane |
| 2 | Unblock Vercel account/project evidence | P1 | successful deployment for exact candidate SHA + logs + immutable URL | `ef447d8e` rejected: `Account is blocked`; owner action required |
| 3 | Fail-closed catalog resolution (WP-001) | P1 | outage→503/LKG; confirmed empty→200; confirmed missing→404; tests/build/browser | implemented, committed, pushed; Vercel deployment `2P6Pnq…` built, remote browser access blocked |
| 4 | Capability-driven public copy (WP-002) | P1 | locale/source contract + build + desktop/mobile browser + exact deployment | implemented, committed, pushed; `4c209069` deployed as `D9WetK…`; final `ef447d8e` deployment blocked |
| 5 | Clean release-candidate integration | P1 | WP commits on controlled ancestry; no unrelated dirty state; reproducible SHA | done: `a07327db`, no conflicts, clean worktree, 54 focused/evidence tests pass |
| 6 | Remote preview full-flow verification | P1 | catalog/detail/card/CTA crawl, no-JS/slow path, smoke bound to deployment | blocked by Vercel account/scope |
| 7 | Production promote and post-deploy proof | P0/P1 | same artifact ID/SHA, health, rollback, catalog/detail parity | forbidden until orders 0–2 close |
| 8 | Analytics/consent/conversion proof | P1 | healthy SHA-bound report + clean-browser consent matrix | code binding improved; production proof pending healthy deployment |
| 9 | Route/interaction/data inventory regeneration | P1/P2 | current owners, states, coverage and evidence links | pending |
| 10 | Profile `/guide/bezopasnost` cold SSR | P2 | server timing decomposition and safe latency reduction | newly observed 7.9–8.6 s; functional render succeeds |

## Выполненные безопасные пакеты

### WP-001 — fail-closed catalog resolution

Typed result boundaries preserve `unavailable` instead of collapsing failures to absence. APIs, RSC/UI, LKG and evidence producers now distinguish outage, confirmed empty and confirmed missing. No schema, partner write or checkout behavior changed.

### WP-002 — product truth

Global and high-risk route copy now derives from proven current behavior: GoArgentina may accept an internal request or hand off to a partner, and the card/seller owns the applicable payment/cancellation rules. Unsupported blanket promises were removed across RU/EN/ES/PT and protected with source/locale tests.

## Почему порядок изменён

- WP-002 moved ahead of infrastructure-blocked work because it was reversible, testable and removed active trust/legal exposure without touching broken data paths.
- Candidate promotion remains below Vercel account recovery: exact clean SHA `a07327db` was rejected and a locally proven SHA without a deploy ID is not a remote preview.
- Safety guide latency is recorded as P2, not allowed to displace the production data-plane P0 without profiling evidence.
- No growth or new feature work is allowed while production health, migration parity, recoverability and exact deployment evidence remain open.
