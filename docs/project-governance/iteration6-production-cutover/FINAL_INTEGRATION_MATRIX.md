# Iteration 6 — Final Integration Matrix

Generated: 2026-08-19 (Iteration 6)

| Layer | Before (audit baseline) | Final (I6 candidate) |
|-------|-------------------------|----------------------|
| Git `main` | `81055b1387e0062301ca9c0ae7468cbf782e2511` | unchanged (pre-merge) |
| Candidate branch | `cursor/iteration5-deep-certification-5475` @ `eca6ce29` | `cursor/iteration6-final-integration-5475` (I5 + I6 fixes) |
| PR lineage | `#30→#31→#32→#33→#34` linear; 0 unique commits outside I5 | confirmed; I6 extends I5 |
| CI Playwright | hung on `install --with-deps` (cancelled) | `install chromium` + 10m step timeout |
| CI evidence | stale `*-last.json` uploaded under new SHA | run-scoped `var/ops/ci/<run>/<sha>/` + SHA validation |
| Vercel | stale "Account is blocked" in docs | re-probe pending on fresh CI deploy |
| Supabase | REST 402 / DB timeout on live | canonical ref `uooxrypocahomoqzdvzy`; agent env DNS blocked |
| DB connectivity | production 503 `dependency_timeout` | not restored in agent env |
| Migrations | journal on old SHA only | candidate includes I3–I5 security/grants migrations |
| RLS | not live-proven | not live-proven |
| Backup | workflow secrets empty | not proven |
| Production SHA | `81055b13` | unchanged until merge + deploy |

## PR supersession proof

| PR | Head (at audit) | Unique commits not in I5 | Superseded by #34/I6? |
|----|-----------------|--------------------------|------------------------|
| #30 I1/S7 | sprint7 chain | 0 | yes |
| #31 I2 | iteration2 | 0 | yes |
| #32 I3 | iteration3 | 0 | yes |
| #33 I4 | iteration4 | 0 | yes |
| #34 I5 | `eca6ce29` | n/a | included in I6 branch |
