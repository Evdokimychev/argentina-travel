# Performance final report — Iteration 4

Measured against live production `81055b13` on 2026-08-19. These are
single-request TTFB+body times from this agent, not lab Lighthouse scores.
No Core Web Vitals field data was available.

| Page | HTTP | Time (s) | Bytes | Notes |
|------|-----:|---------:|------:|-------|
| `/` | 200 | 0.78 | 181919 | Shell; catalog cannot be trusted |
| `/tours` | 200 | 0.33 | 159513 | Shell |
| `/excursions` | 200 | 0.30 | 99571 | Shell |
| `/guide` | 200 | 0.16 | 251268 | |
| `/baza-znaniy` | 200 | 0.14 | 136247 | |
| `/blog` | 200 | 0.50 | 448568 | Large list HTML |
| `/contacts` | 200 | 0.22 | 118524 | |
| `/mapa-argentina` | 200 | 0.42 | 450595 | Map bundle already on page |
| `/destinations` | 200 | 0.39 | 297348 | |
| `/places` | 200 | 0.26 | 480799 | Heavy geography HTML |
| `/guide/buenos-aires` | 200 | 0.18 | 102464 | |
| `/blog/natsionalnyy-park-iguasu` | 200 | 0.56 | 648502 | Cornerstone article |
| `/robots.txt` | 200 | 0.04 | 629 | |
| `/sitemap.xml` | 200 | 1.58 | 45456 | Slowest static probe |
| `/api/health` | 503 | 0.08–2.52 | ~JSON | Truthful down |
| `/api/tours` | 503 | 0.26 | 33 | Fail-closed |
| `/api/excursions` | 503 | 0.62 | 71 | Fail-closed |

## Controlled concurrency

12 parallel `/api/health` requests: all 503, wall 2.54s, p50 0.74s, p95 2.25s.
No hang. This is **not** a production soak or a provider DoS.

## What was not chased

- Artificial 100/100 Lighthouse.
- Micro-chunk splits.
- Blind new indexes (no live `EXPLAIN`).
- Map rewrite.

## Bottlenecks that remain real

1. Data-plane outage dominates any CWV discussion.
2. `/places`, `/blog`, map HTML are large; acceptable until DB returns.
3. Sitemap 1.58s is noticeable for crawlers; not P0 while health is down.
4. Partner image originals can still be large; existing width transform retained.

## Bundle / third-party

- Map and admin editors already lazy-load in earlier sprints.
- YM/GTM load only after analytics consent.
- I4 did not add third-party scripts.
