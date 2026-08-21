# UX / Functional defect ledger — Iteration 8

Generated: 2026-08-21  
Environment: Vercel preview `argentina-travel-fqlkbkw8z-go-argentina.vercel.app` (SHA lineage from I7 candidate) + local fixes on `cursor/iteration8-ui-human-certification-5475`

| ID | Sev | Surface | Defect | Status | Evidence |
|----|-----|---------|--------|--------|----------|
| P1-I8-001 | P1 | `/tours` | Catalog outage rendered as «Туры не найдены / измените фильтры» | **fixed** in candidate | `i8-p1-tours-page-no-tours.png`; ToursCatalog + page.tsx |
| P2-I8-001 | P2 | SiteSearch | Previous query hits stayed visible while typing a new query (Буэнос-Айрес showed Патагония) | **fixed** in candidate | `i8-p1-search-buenos-aires-stuck.png`; clear `apiHits` on refetch |
| P2-I8-002 | P2 | Catalog/API | Live DB down → tours API 503; excursions error page clearer than tours was | mitigated by P1-I8-001; data plane BLOCKED_EXTERNAL | health 503 |
| P3-I8-001 | P3 | Search | Debounce delay feels slow on first open | open | Phase A notes |
| NOTE | — | KB quarantine | `/baza-znaniy/stoimost-zhizni-ba` soft-unavailable after I7 quarantine; redirects retargeted to blog budget | fixed redirects | content-plan-url-redirects |

## Classification notes

- Do **not** treat honest empty/outage copy as PASS if primary empty title still blames filters (P1-I8-001).
- Search «no results» on first agent pass was a false alarm (results appear after debounce); keep P2 stale-hit issue.
