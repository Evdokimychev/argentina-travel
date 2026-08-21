# Architecture Debt Matrix — Iteration 7

| Hotspot | Lines | Action taken | Residual risk |
|---------|-------|--------------|---------------|
| OrganizerTourEditorView | 2270 | Reviewed; no silent empty-on-error regression beyond I5 | Coupling still high; selective extract when next editor bug found |
| PageBuilderBlockFields | 1874 | Reviewed for crash paths only | Large form surface |
| ContentDocumentEditorView | 1530 | CAS live still unproven (infra) | Needs live two-editor test |
| bookings-store | 1513 | No rewrite | SSOT complexity remains |
| TourCheckoutModal | ~1874? path `checkout/` | Own payments gated | Keep dormant payment paths quarantined |
| AuthModal | 1386 | Uses normalizeSiteError; no AbortController on overlapping submits | Soft race risk — monitor |

## Env / scripts

- ~267 `process.env.*` references — dormant modules still contribute names.
- Fail-fast for CORE already present in build validation.
- Do not require dormant secrets for CORE build (confirmed by CI placeholder build).

## Selective decomposition rule (kept)

Only extract when a concrete defect class is proven. Line count alone is not a refactor trigger in I7.
