# Marketplace Audit — Iteration 7 (code-level; live scan blocked)

## Live status

Production catalog APIs still 503 on SHA `81055b13`. Full live outlier scan **not possible** until data plane recovery + deploy.

## Candidate protections (already in tree / verified by tests)

| Risk | Mechanism | Test evidence |
|------|-----------|---------------|
| Past departures | `isPastYmd` drop / hide past-only | `offer-quality.test.ts` |
| Garbage “на сковороде” | `NONSENSE_TRANSLATION_RE` quarantine | `content-quality` / offer-quality |
| São Paulo / Foz → Argentina | `cross-border-cities` inference | `cross-border-cities.test.ts` |
| Provider outage → empty catalog | soft-degrade / unavailable states (I5) | public-tour-resolver / search tests |

## After deploy (required)

Re-run full catalog scan for:

- expired dates count
- invalid geography
- zero / insane prices
- broken images/URLs
- quarantined count

Do not invent counts while provider/DB is down.
