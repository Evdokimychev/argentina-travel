# Page image audit

Generated: 2026-06-21T05:49:18.867Z

## Summary

| Metric | Value |
| --- | ---: |
| Manifest assets | 582 |
| Stock (Unsplash/Pexels local) | 334 |
| Wikimedia local | 244 |
| Pages audited | 21 |
| Pages with local/resolver images | 19 |
| Pages with Unsplash hotlinks in view | 1 |
| Global Unsplash refs in src/ (excl. archive) | 150 in 20 files |

## Pages

| Route | Status | Resolver | Local URLs | Unsplash hotlinks |
| --- | --- | --- | ---: | ---: |
| / | local-resolver | yes | 1 | 0 |
| /blog | local-resolver | yes | 0 | 0 |
| /blog/[slug] | local-resolver | yes | 0 | 0 |
| /guide | local-resolver | yes | 0 | 0 |
| /guide/[slug] | local-resolver | yes | 1 | 0 |
| /immigration | local-resolver | yes | 0 | 0 |
| /immigration/[slug] | local-resolver | yes | 1 | 0 |
| /flights | local-resolver | yes | 0 | 0 |
| /transfers | local-resolver | yes | 0 | 0 |
| /insurance | local-resolver | yes | 0 | 0 |
| /esim | local-resolver | yes | 0 | 0 |
| /car-rental | local-resolver | yes | 0 | 0 |
| /services | local-resolver | yes | 1 | 0 |
| /shop | local-resolver | yes | 0 | 0 |
| /audio-guides | local-resolver | yes | 0 | 0 |
| /gallery | local-resolver | yes | 0 | 0 |
| /contacts | local-resolver | yes | 0 | 0 |
| /destinations | local-resolver | yes | 0 | 0 |
| /podbor | local-resolver | yes | 0 | 0 |
| /tours | hotlink | yes | 0 | 27 |
| /places | no-static-image | no | 0 | 0 |

## Pages needing migration

### /tours

- View: `src/data/tours.ts`
- `https://images.unsplash.com/photo-1558980664-769d59546b3d?w=800&q=80`
- `https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80`
- `https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80`
- `https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80`
- `https://images.unsplash.com/photo-1519682337058-a94d51933763?w=800&q=80`

## Remaining Unsplash references (by file)

User-facing page heroes should use `media-resolver`. Seed/demo avatars may remain.

- `src/components/about/DesignSystemShowcase.tsx` (1)
- `src/components/organizer/OrganizerBioExampleModal.tsx` (1)
- `src/components/tour-detail/checkout/checkout-addons.ts` (4)
- `src/data/blog-author.ts` (1)
- `src/data/guide-topics.ts` (14)
- `src/data/join-page.ts` (4)
- `src/data/marketplace-tours.ts` (16)
- `src/data/organizer-tours.ts` (5)
- `src/data/places-seed.ts` (9)
- `src/data/tour-accommodation-defaults.ts` (1)
- `src/data/tour-accommodation-seeds.ts` (4)
- `src/data/tour-details/patagonia.ts` (26)
- `src/data/tour-extra.ts` (6)
- `src/data/tour-guides-defaults.ts` (5)
- `src/data/tour-impressions-defaults.ts` (3)
- `src/data/tours.ts` (42)
- `src/lib/bookings-store.ts` (4)
- `src/lib/image-provider/unsplash-client.ts` (1)
- `src/lib/organizer-tour-store.ts` (1)
- `src/lib/waitlist-store.ts` (2)

## Recommendations

- Run `npm run fetch-stock-media` after setting `UNSPLASH_ACCESS_KEY` / `PEXELS_API_KEY`
- Hero images: `getServicePageHeroImage`, `getImmigrationTopicHeroImage`, `getGuideTopicHeroImage`
- Tours catalog: `getTourCoverImage` (already wired in `tours.ts` export)
- Rich blog: `getRichArticleGallery` + `SafeImage` with lazy loading
