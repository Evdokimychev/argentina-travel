# User journey matrix — Iteration 8 (in progress)

| Persona | Journey | Desktop | Mobile | Negative | Persistence | Result |
|---------|---------|:-------:|:------:|:--------:|:-----------:|--------|
| Visitor | Homepage first impression | ✓ | ✓ | — | — | PASS (brand clear) |
| Visitor | Header/footer nav | ✓ | ✓ | — | — | PASS |
| Visitor | Global search Игуасу/виза/Патагония | ✓ | pending | empty query | — | PASS with catalog notice |
| Visitor | Search stale-hit while typing | ✓ | — | mid-type | — | FAIL→fixed P2-I8-001 |
| Visitor | Tours browse | ✓ | pending | outage | — | FAIL misleading empty→fixed P1-I8-001 |
| Visitor | Excursions | ✓ | pending | outage | — | PASS honest error |
| Visitor | Knowledge base hub→article | ✓ | pending | — | — | PASS |
| Visitor | Blog index→article | ✓ | pending | — | — | PASS |
| Visitor | Map | ✓ | pending | — | — | PASS (58 places) |
| Visitor | Legacy `/st_tour/*` | ✓ | — | — | — | PASS redirect |
| Visitor | Auth modal open | ✓ | pending | — | — | PASS open only |
| Client | Booking request | blocked | blocked | — | — | BLOCKED_EXTERNAL (DB) |
| User | Register/login/delete | pending | pending | — | — | pending |
| Organizer | Apply/create tour | pending | pending | — | — | pending |
| Admin | CRM/CMS | pending | pending | — | — | pending |

| Visitor | Podbor / matcher | ✓ fail→fixed | pending | outage | session | FAIL crash→fixed P0-I8-001 |
| Visitor | Become organizer (/join) | ✓ | ✓ | validation | — | PASS UI (auth submit blocked) |
| Client | Booking request | blocked | blocked | — | — | BLOCKED_EXTERNAL |
