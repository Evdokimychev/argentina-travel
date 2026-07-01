# Page image audit

Generated: 2026-06-29T00:55:35.140Z

## Summary

| Metric | Value |
| --- | ---: |
| Manifest assets | 635 |
| Stock (Unsplash/Pexels local) | 385 |
| Wikimedia local | 246 |
| Pages audited | 21 |
| Pages with local/resolver images | 15 |
| Pages with Unsplash hotlinks in view | 0 |
| Global Unsplash refs in src/ (excl. archive) | 1 in 1 files |

## Pages

| Route | Status | Resolver | Local URLs | Unsplash hotlinks |
| --- | --- | --- | ---: | ---: |
| / | no-static-image | no | 0 | 0 |
| /blog | no-static-image | no | 0 | 0 |
| /blog/[slug] | local-resolver | yes | 0 | 0 |
| /guide | local-resolver | yes | 0 | 0 |
| /guide/[slug] | local-resolver | yes | 1 | 0 |
| /immigration | local-resolver | yes | 0 | 0 |
| /immigration/[slug] | local-resolver | yes | 1 | 0 |
| /flights | no-static-image | no | 0 | 0 |
| /transfers | local-resolver | yes | 0 | 0 |
| /insurance | no-static-image | no | 0 | 0 |
| /esim | local-resolver | yes | 0 | 0 |
| /car-rental | no-static-image | no | 0 | 0 |
| /services | local-resolver | yes | 1 | 0 |
| /shop | local-resolver | yes | 0 | 0 |
| /audio-guides | local-resolver | yes | 0 | 0 |
| /gallery | local-resolver | yes | 0 | 0 |
| /contacts | local-resolver | yes | 0 | 0 |
| /destinations | local-resolver | yes | 0 | 0 |
| /podbor | local-resolver | yes | 0 | 0 |
| /tours | local-resolver | yes | 0 | 0 |
| /places | no-static-image | no | 0 | 0 |
## Remaining Unsplash references (by file)

User-facing page heroes should use `media-resolver`. Seed/demo avatars may remain.

- `src/lib/image-provider/unsplash-client.ts` (1)

## Recommendations

- Run `npm run fetch-stock-media` after setting `UNSPLASH_ACCESS_KEY` / `PEXELS_API_KEY`
- Hero images: `getServicePageHeroImage`, `getImmigrationTopicHeroImage`, `getGuideTopicHeroImage`
- Tours catalog: `getTourCoverImage` (already wired in `tours.ts` export)
- Rich blog: `getRichArticleGallery` + `SafeImage` with lazy loading
