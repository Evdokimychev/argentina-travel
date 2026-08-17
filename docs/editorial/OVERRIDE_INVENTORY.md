# Legacy blog override inventory (Sprint 3)

Generated as part of Content OS consolidation.  
Canonical policy: `CONTENT_OWNERSHIP_CONTRACT.md`.

## Goal

Invisible third-layer edits must not remain the long-term SSOT.

| Override map | Approx. size | Action | Notes |
|--------------|-------------:|--------|-------|
| `legacyManualBlogPosts` in `src/data/blog.ts` | large inline corpus | MIGRATE | Move to MD/typed modules via existing sync pipelines; keep URL/slug |
| `legacyManualOfficialSources` | 0 | REMOVE-ready | Wildlife/nature batch migrated; maps empty |
| `legacyManualExcerptOverrides` | 0 | REMOVE-ready | Wildlife excerpt folded into typed module |
| `legacyManualReplacementSections` | 0 | REMOVE-ready | Itinerary + iguazu-3d + flights + wildlife migrated |
| `legacyManualSectionOverrides` | 0 | REMOVE-ready | Penguins, whale-watching, Garganta, Uco Valley migrated |
| `legacyManualRemovedSections` | 0 | REMOVE-ready | Month-section removals folded into typed modules |
| `EDITORIAL_OVERRIDES` (`src/data/blog-editorial`) | ~38 | KEEP TEMPORARILY → MIGRATE | Typed polish for Class B; canonical map now forces noindex + `canonicalSlug` even when `publicationReady` |

## Precedence reminder

File blog assembly + CMS merge (`blog-resolver`) owns publication.  
Overrides are compatibility only — do not add new override maps.

## Dual block system

- Canonical: `BlogBodyBlock`
- Legacy bridge: `adaptRichBlockToBody` / `adaptRichBlocksToBody`
- Deprecate Rich-only public renderers only when usage = 0 and visual QA passes

## Commands

```bash
npm run content:source-matrix
npm run content:quality
npm run sync-rich-articles:check
npm run sync-manual-posts:check
npm run editorial:audit
```
