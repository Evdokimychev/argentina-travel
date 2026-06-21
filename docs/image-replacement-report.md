# Image replacement report

Generated: 2026-06-21T05:49:18.875Z

## Summary counts

| Metric | Count |
| --- | ---: |
| Manifest assets (local) | 582 |
| Stock downloaded (Unsplash/Pexels) | 334 |
| Wikimedia in manifest | 244 |
| Pages migrated to media-resolver | 19 |
| Pages with remaining hotlinks | 1 |
| Global Unsplash refs in src/ | 150 |
| Files with Unsplash refs | 20 |

## Replacement status

- **Completed**: service pages, immigration, blog heroes, podbor, shop, rich national park galleries
- **Intentional hotlinks**: tour seed data, organizer avatars, checkout addon thumbnails, DesignSystemShowcase demo
- **Next**: migrate `src/data/tours.ts`, `marketplace-tours.ts`, `guide-topics.ts` to `getTourCoverImage` / manifest bindings

## Pages needing manual review

- `/tours` — `src/data/tours.ts` (27 hotlinks)

## Files with Unsplash references

- `src/components/about/DesignSystemShowcase.tsx`: 1
- `src/components/organizer/OrganizerBioExampleModal.tsx`: 1
- `src/components/tour-detail/checkout/checkout-addons.ts`: 4
- `src/data/blog-author.ts`: 1
- `src/data/guide-topics.ts`: 14
- `src/data/join-page.ts`: 4
- `src/data/marketplace-tours.ts`: 16
- `src/data/organizer-tours.ts`: 5
- `src/data/places-seed.ts`: 9
- `src/data/tour-accommodation-defaults.ts`: 1
- `src/data/tour-accommodation-seeds.ts`: 4
- `src/data/tour-details/patagonia.ts`: 26
- `src/data/tour-extra.ts`: 6
- `src/data/tour-guides-defaults.ts`: 5
- `src/data/tour-impressions-defaults.ts`: 3
- `src/data/tours.ts`: 42
- `src/lib/bookings-store.ts`: 4
- `src/lib/image-provider/unsplash-client.ts`: 1
- `src/lib/organizer-tour-store.ts`: 1
- `src/lib/waitlist-store.ts`: 2
