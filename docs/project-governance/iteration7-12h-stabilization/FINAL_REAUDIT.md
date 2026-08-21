# FINAL_REAUDIT — Iteration 7 adversarial pass

## Challenge question

> If the candidate is wrongly assumed stable, where is the next serious defect?

## Ten risk candidates checked

| # | Risk | Check | Result |
|---|------|-------|--------|
| 1 | Redirect syntax still invalid | path-to-regexp + clean build | PASS after fix |
| 2 | Stale Lighthouse evidence | CI workflow contract test | PASS after fix |
| 3 | Sitemap hang | production curl timeout; code budgets | live FAIL (old SHA); candidate hardened |
| 4 | Cron abort cascade | source + isolation tests | PASS after fix |
| 5 | Typing presence stale UI | read path filters by TTL | PASS (cleanup is housekeeping) |
| 6 | Booking “24h” exactness | cron selects BA calendar tomorrow | DOCUMENTED limitation |
| 7 | Dormant module error leaks | forum/shop scan | PASS after fix |
| 8 | Repo bloat re-entry | gitignore/vercelignore tests | PASS |
| 9 | Geography / skillet copy | unit tests already present; live old SHA | candidate PASS; live FAIL until deploy |
| 10 | Vercel “blocked” claim | PR #35 Vercel FAILURE = build error | CLAIM UPDATED |

## Independent conclusion

Candidate quality improved materially. Production certification still impossible without data-plane recovery and deploy of cumulative SHA.
