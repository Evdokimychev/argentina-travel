# User journey matrix — Iteration 8 (in progress)

| Persona | Journey | Desktop | Mobile | Negative | Persistence | Result |
|---------|---------|:-------:|:------:|:--------:|:-----------:|--------|
| Visitor | Homepage first impression | ✓ | ✓ | — | — | PASS (brand clear) |
| Visitor | Header/footer nav | ✓ | ✓ | — | — | PASS |
| Visitor | Global search Игуасу/виза/Патагония | ✓ | ✓ | empty / nonsense | — | PASS; hang→fixed P1-I8-004 |
| Visitor | Search stale-hit while typing | ✓ | — | mid-type | — | FAIL→fixed P2-I8-001 |
| Visitor | Tours browse | ✓ | ✓ | outage | — | FAIL misleading empty→fixed P1-I8-001 |
| Visitor | Excursions | ✓ | ✓ | outage | — | PASS soft-degrade honesty (P2-I8-006) |
| Visitor | Destination BA | ✓ | ✓ | catalog outage | — | FAIL crash→fixed P1-I8-005 |
| Visitor | Knowledge base hub→article | ✓ | ✓ | — | — | PASS |
| Visitor | Blog index→article | ✓ | pending | — | — | PASS |
| Visitor | Map | ✓ | pending | WebGL local | — | PASS product; local env fail |
| Visitor | Booking find | ✓ | ✓ | unavailable / fake email | — | PASS degraded UX (P1-I8-003, P2-I8-005) |
| Visitor | Mobile menu → Контакты | — | ✓ | missing link | — | FAIL→fixed P3-I8-005 |
| Visitor | Legacy `/st_tour/*` | ✓ | — | — | — | PASS redirect |
| Visitor | Auth modal open | ✓ | pending | — | — | PASS open only |
| Client | Booking request | blocked | blocked | — | — | BLOCKED_EXTERNAL (DB) |
| User | Register/login/delete | pending | pending | — | — | pending |
| Organizer | Apply/create tour | pending | pending | — | — | pending |
| Admin | CRM/CMS | pending | pending | — | — | pending |

| Visitor | Podbor / matcher | ✓ fail→fixed | pending | outage | session | FAIL crash→fixed P0-I8-001 |
| Visitor | Become organizer (/join) | ✓ | ✓ | validation | — | PASS UI (auth submit blocked) |
| Client | Booking request | blocked | blocked | — | — | BLOCKED_EXTERNAL |
