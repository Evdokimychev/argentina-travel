# UI feature inventory — Iteration 8 (partial)

| UI area | Function | Works? | Useful? | Persisted? | Recoverable? | Fixed? |
|---------|----------|--------|---------|------------|--------------|--------|
| Home | Brand + CTA | REAL | yes | n/a | n/a | — |
| Home | Tour search widget | PARTIAL (outage) | yes | n/a | n/a | honest empty via catalog |
| Search | Global ⌘K | REAL (static/content) / PARTIAL (live) | yes | n/a | n/a | stale-hit + hang timeout |
| Tours | Catalog browse | PARTIAL outage | yes | n/a | n/a | P1 empty honesty |
| Excursions | Catalog | PARTIAL outage | yes | n/a | n/a | soft-degrade honesty |
| Destinations | Detail page | REAL editorial / PARTIAL tours embed | yes | n/a | n/a | marketplace crash fixed |
| Podbor | Quiz | REAL after fix | yes | session | restart | P0 crash fixed |
| KB / Guide | Hub/article | REAL | yes | n/a | n/a | — |
| Blog | Index/article | REAL | yes | n/a | n/a | — |
| Map | Interactive | REAL on preview; BLOCKED local WebGL | yes | n/a | n/a | — |
| Auth | Modal/validation | REAL UI / BLOCKED backend | yes | no | n/a | noValidate |
| Join | Organizer landing | REAL | yes | n/a | n/a | author images |
| Join | Application submit | BLOCKED auth | yes | unknown | n/a | — |
| Booking | Find by email | PARTIAL / unavailable honest | yes | no | n/a | 503 + no fake «Готово» |
| Booking | Request | BLOCKED catalog | yes | unknown | n/a | — |
| Mobile menu | Контакты | REAL | yes | n/a | n/a | utility CTA in footer |
| Admin/CRM/CMS | Mutations | NOT TESTED (auth) | — | — | — | — |
