# Duplicate images audit

Generated: 2026-06-21

## Summary

- Gallery duplicate groups (manifest): **1**
- All-role duplicate groups (manifest): **4**
- Rich article file-hash duplicate groups: **0**

## Resolver helpers checked

- `getRichArticleGallery` — dedupes by `src` and `contentHash`, supplements from place gallery
- `getPlaceGallery` — dedupes via `Set`
- `getTourGallery` — dedupes via `Set`
- `getDestinationGallery` — dedupes via `Set`
- `resolveGalleryFromArticle` (image-provider) — dedupes by `src` and `contentHash`

## Gallery duplicate groups (manifest)

### place:puerto-madryn (4 assets)

Duplicate `sourceUrl`:

- https://upload.wikimedia.org/wikipedia/commons/2/2d/Peninsula_Vald%C3%A9s_STS-68.jpg → place-puerto-madryn-gallery-2, place-puerto-madryn-gallery-4

## Rich article gallery file duplicates

No byte-identical gallery files.

## Other duplicate groups (non-gallery roles)

- **rich:iguazu-national-park**: 0 duplicate src group(s)
- **rich:los-glaciares-national-park**: 0 duplicate src group(s)
- **rich:tierra-del-fuego-national-park**: 0 duplicate src group(s)
