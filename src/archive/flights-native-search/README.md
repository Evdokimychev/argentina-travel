# Archived: native flight search (pre–White Label)

Replaced on `/flights` by the Travelpayouts White Label widget (`wl_id=17940`).

## Archived files

| Path | Role |
|------|------|
| `components/FlightsSearchView.tsx` | Main `/flights` page (form + Data API results) |
| `components/FlightSearchForm.tsx` | Search form UI |
| `components/FlightOfferCard.tsx` | Offer cards from `/api/flights/prices` |
| `components/AirportCombobox.tsx` | Autocomplete combobox |
| `api/flights-autocomplete-route.ts` | Former `GET /api/flights/autocomplete` |
| `api/affiliate-flights-search-route.ts` | Former `GET /api/affiliate/flights/search` |

## Still active (not archived)

- **Price teasers** — `hub-price-teasers.ts`, route landings, tour/destination widgets
- **`GET /api/flights/prices`** — used by `FlightRoutePriceHint` on domestic routes map
- **`GET /api/affiliate/flights/book`** — affiliate redirect for teaser ticket links
- **Travelpayouts Data API** — `lib/travelpayouts/aviasales/data-api.ts`

## Restore native search

1. Copy components back to `src/components/flights/`
2. Restore API routes under `src/app/api/…`
3. Point `src/app/flights/page.tsx` at `FlightsSearchView` instead of `FlightsWhitelabelView`

Archived: 2026-06-10.
