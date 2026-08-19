# Reliability failure matrix — Iteration 4

Destructive production failure was not injected. Evidence is live outage
behavior plus source contracts.

| Scenario | How observed | User effect | Ops effect | Status |
|----------|--------------|-------------|------------|--------|
| Database unavailable | Live health 503; DB 75ms `dependency_unavailable`; direct PG 23ms | Catalog APIs 503; HTML shells still 200 | Health `status=down`, SHA visible | PASS (truthful) |
| Connection timeout | Health probe budget 5s; concurrent 12× health p95 2.25s max 2.52s | No infinite hang | Requests complete | PASS |
| Pool exhaustion | Not injected | n/a | n/a | BLOCKED_EXTERNAL |
| REST quota | Historical + current 402 class; circuit from earlier sprints | Empty/false catalog forbidden in candidate; live old SHA still degraded | Partner/search checks fail | DEGRADED live / mitigated in candidate |
| Partner API down | `/api/health/partners` all sources `down` | Catalog 503, pages do not crash | Per-provider status | PASS (truthful) |
| Partner malformed data | I2 quality layer + tests | Bad row hidden, not shown as current | n/a | PASS code / live feed BLOCKED |
| Slow dependency | Catalog 503 in 0.26–0.62s | Fail fast | Bounded | PASS |
| Duplicate webhook / booking key | Existing idempotency + I4 fail-closed limiter | No double write in tests | n/a | PASS code / live BLOCKED |
| Cache after CMS publish | I3 `revalidateCmsPublicSurfaces` | Stale ISR risk reduced in candidate | n/a | PASS code / live BLOCKED |
| Process restart | In-memory rate limit resets per instance | Weaker abuse window without Upstash | Documented | DEGRADED unless Upstash |
| Partial organizer approve | I3 RPC-only decisions; grant revoke | No staff UPDATE race | Audit via RPC | PASS code / live BLOCKED |
| Retry storm | security_critical fail-closed; no infinite retry in booking path | 429 | logs | PASS code |
| Error boundary | Earlier blog/guide optional catalog isolation retained | Editorial can render without catalog | n/a | PASS code / old SHA live |
| Own payment | `productionEnabled: false` + reject gate | Cannot accidentally charge | n/a | PASS (off) |

## In-memory state

Critical booking/lead/CMS state is intended durable (Postgres). Rate-limit
counters are the remaining process-local security control when Upstash is unset.
That is **not** global protection.
