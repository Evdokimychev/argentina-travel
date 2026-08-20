# Public UX / SEO Matrix — Iteration 7

| Check | Candidate | Live production |
|-------|-----------|-----------------|
| Build redirects `/st_tour/*` | PASS (exact + middleware prefixes) | Old SHA catch-all only |
| Geography labels | PASS (cross-border) | Still shows São Paulo/Foz as Argentina |
| Visa FAQ redirect | In I2+ candidate | Still 200 on old SHA |
| Sitemap | Budgeted degrade | Times out / hangs |
| Search outage UX | I5 notices | Live 500 |
| Content editorial gates | blog 67/67, guide 29/29 in prior CI content | Unchanged |
| Mobile/tablet journeys | Covered by existing e2e suites | Not re-run on live DB |

## Sitemap root cause (classified)

Production timeout is primarily **data-plane hang** (DB unavailable), amplified by expensive collectors (excursions city N+1). I7 adds hard budgets so a recovered deploy does not reintroduce unbounded waits.
