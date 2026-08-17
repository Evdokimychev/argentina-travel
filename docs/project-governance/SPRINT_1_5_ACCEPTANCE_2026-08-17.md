# Sprint 1–5 factual acceptance (runtime, 2026-08-17)

Generated evidence snapshot for Sprint 6 gatekeeping. Not historical narrative.

| Sprint | Expected DoD | Branch / PR | Tip SHA | Production SHA | CI | Production evidence | Unfinished | Decision |
|--------|--------------|-------------|---------|----------------|----|---------------------|------------|----------|
| 1 Recovery | Healthy data plane, SHA match, release gate | `main` | `a90e2630` | `a90e2630` | historically green on tip | `/api/health` **down**; DB + Direct PG `dependency_unavailable` | Data plane | **NOT production-accepted** |
| 2 Marketplace | Trust gates, freshness, partner targets | on `main` lineage | `a90e2630` | same | n/a live | Live catalog QA blocked by health | Live crawl/freshness | **Code ready / live BLOCKED** |
| 3 Content OS | Ownership, quarantine, SEO | merged on `main` | `a90e2630` | same | verify green historically | Sitemap 509 OK; some blog metadata soft-fail when DB down | Live SEO titles on soft-unavailable pages | **PARTIAL production** |
| 4 Public UX | a11y/journeys/perf | PR [#27](https://github.com/Evdokimychev/argentina-travel/pull/27) | `b2fa662f` | not deployed | re-running after smoke fix | Not on prod | Merge + deploy + prod verify | **IN PROGRESS** |
| 5 Growth | Analytics live, leads, paid GO/NO-GO | PR [#28](https://github.com/Evdokimychev/argentina-travel/pull/28) | `efbd7801` | not deployed | pending | No GTM/Metrika in prod HTML; promotion gate Paid Traffic **NO-GO** | Env + DB + live proof | **IN PROGRESS / external blockers** |

## Production probes (same day)

- Canonical host: `https://www.goargentina.ru`
- Health: `status=down`, `gitSha=a90e2630ef10c59c315fcd9ecb14f235dba64f0b`
- Homepage HTTP 200 (soft-degrade)
- Analytics markers in HTML: GTM/dataLayer/Metrika/Clarity/verification = **absent**

## Sprint 6 start rule

Do **not** treat Sprint 6 as completeable to production acceptance until:

1. Sprint 4 CI green → merge path clear
2. Sprint 5 CI green → merge after/with 4
3. Production deploy SHA updated
4. Direct Postgres restored for live RLS/lead/backup evidence

Site-side Sprint 6 hardening may proceed on a branch only after 4/5 code is integrated or explicitly stacked; live RLS/restore remain EXTERNAL until DB is up.
