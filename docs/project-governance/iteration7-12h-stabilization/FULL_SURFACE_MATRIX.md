# Full Surface Matrix — Iteration 7 (recount)

| Surface | Count | Notes |
|---------|-------|-------|
| Pages (`page.tsx`) | 159 | Matches prior baseline |
| API handlers (`route.ts`) | 309 | Was ~314 historically |
| Admin API | 114 | Large; keep role matrix |
| Organizer API | 35 | Ownership required on mutate |
| Cron files | 22 | Only 4 Vercel schedules |
| Migrations | 111 | Live parity BLOCKED_EXTERNAL |
| Env refs | ~267 | Classify CORE vs DORMANT ongoing |
| Media files (public+content) | ~3522 | Several >10MB remain |

## Lifecycle (sampled)

| Family | Classification | Public leak risk |
|--------|----------------|------------------|
| Shop | DORMANT/quarantined | Nav gated; API sanitized I7 |
| Forum | DORMANT/quarantined | Nav gated; API sanitized I7 |
| Mobility/transfers | POST_LAUNCH / dormant | Module visibility |
| Own payments | FROZEN/gated | Webhooks remain; public checkout gated |
| CORE tours/excursions/KB/blog | CORE_NOW | Search/catalog soft-degrade in I5 |

## Admin surface note

114 `/api/admin` handlers is high for current ops headcount. No mass deletion this iteration — security depends on `authorizeAdminRequest` + RLS. Follow-up: group by capability and retire unused POST_LAUNCH admin routes after reference proof.
