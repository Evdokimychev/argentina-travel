# Partner attribution reconciliation process (Sprint 5)

Site-side handoff can be proven via controlled `partner_checkout_click` + affiliate click logs.
Partner **sale/commission** is never inferred from clicks.

## Evidence levels

| Level | Meaning |
|---|---|
| CODE CONTRACT | URL builders, subid/click id params |
| PRODUCTION TEST EVENT | synthetic marked handoff |
| PARTNER SANDBOX | partner test conversion |
| LIVE PARTNER DASHBOARD | operator export / API |
| LIVE BUSINESS OUTCOME | paid commission posted |

## Practical process (when API unavailable)

1. Export site clicks for date range: partner, product, click/event id, landing, UTMs.
2. Export partner dashboard conversions for same range.
3. Match on click id / subid / order date+product; mark `matched` / `unmatched` / `pending`.
4. Store reconciliation status in ops notes — do not write estimated revenue into KPI.

## Required for Paid Traffic GO

At least one enabled partner must reach `partnerDashboardProof` + `reconciliation` evidence
in `var/ops/partner-attribution-last.json`. Screenshots/data must be real — never fabricated.
