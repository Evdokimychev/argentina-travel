# Article / Blog Editorial Architecture Audit

**Date:** 2026-07-25  
**Scope:** Go Argentina / argentina-travel — blog posts, rich articles, page builder, CMS overrides, MD→TS pipelines  
**Status:** Discovery audit (no code changes)

---

## 1. Executive summary

The blog has **two parallel article engines** plus a **CMS/page-builder layer**:

| Engine | Content model | Primary renderer | Typical use |
|--------|---------------|------------------|-------------|
| **Section posts** | `BlogPost` + `BlogPostSection[]` (`body` markdown-ish prose ± typed `blocks`) | `BlogSectionBody` via `parseBlogSectionBody` / `resolveBlogSectionBlocks` | Cornerstone manuals, steak guide, MD-synced posts, plan posts |
| **Rich articles** | `BlogRichArticle` + `BlogRichBlock[]` | `BlogRichArticle` (+ client blocks) | National-park long guides |
| **CMS / page builder** | Same `BlogBodyBlock` union in `content_documents` JSONB | `renderBlogBodyBlock` / `BlogSectionBody` | Admin + organizer editors |

There is **no Zod schema** for blog blocks; validation is imperative via `normalizeBlogBodyBlock`. There is **no Storybook**. Shared reading chrome is `ContentReadingLayout` + `TableOfContents` (mobile + desktop).

---

## 2. Blog block types (unions / schemas)

### 2.1 Canonical typed union — `BlogBodyBlock`

**File:** `/workspace/src/types/blog-content-blocks.ts`  
**Alias:** `PageBuilderBlock`

Supporting types in the same file:

- `BlogCalloutVariant` — `"important" | "tip" | "hack" | "know" | "mistake" | "warning"`
- `BlogChecklistItem`, `BlogSeasonItem`, `BlogBudgetItem`, `BlogGalleryItem`
- `BlogVideoProvider` — `"youtube" | "vimeo"`
- `BlogContentEmbedKind` — `"tour" | "excursion" | "article" | "guide"`
- `BlogCtaVariant` — `"primary" | "secondary" | "outline"`
- `BlogInfoboxVariant` — `"important" | "tip" | "warning"`
- `BlogRouteMapPoint`, `BlogImageTextPosition`, `BlogFactItem`
- `BlogSectionKind` — `"default" | "faq" | "mistakes" | "checklist" | "tips"`

**`BlogBodyBlock["type"]` values:**

| Type | Role |
|------|------|
| `paragraph` | Text / optional sanitized `html` |
| `subheading` | In-section H3 |
| `bullets` | Unordered list |
| `checklist` | Checkbox / negative items |
| `steps` | Numbered steps |
| `table` | Tabular data |
| `comparison-table` | Table + optional `highlightColumn` |
| `callout` | Editorial callout |
| `infobox` | Compact tip/warning box |
| `faq` | Q&A accordion UI |
| `accordion` | Generic title/body accordion |
| `divider` | Section divider |
| `map` | Single lat/lng point |
| `route-map` | Multi-point route |
| `ticket-link` | External ticket CTA |
| `cta` | Internal/external CTA button |
| `tour-booking` | Tour slug booking CTA |
| `content-embed` | Embed tour/excursion/article/guide |
| `seasons` | Season pros/cons widget |
| `season-matrix` | Travel widget (first-class type) |
| `tourism-infographic` | Travel widget |
| `tourism-timeline` | Travel widget / timeline |
| `budget` | Budget rows |
| `media` | Single image + caption |
| `image-text` | Photo + editorial text |
| `author-card` | Inline author/expert card |
| `facts-grid` | Fact tiles |
| `quote` | Pull quote |
| `gallery` | Multi-image gallery |
| `video` | YouTube/Vimeo |
| `widget` | Generic `widgetKey` embed |

### 2.2 Rich-article union — `BlogRichBlock`

**File:** `/workspace/src/types/blog-rich-article.ts`

Types: `BlogRichCalloutVariant`, `BlogRichSpot`, `BlogRichSeason`, `BlogRichArticleSection`, `BlogRichArticle`

**`BlogRichBlock["type"]` values:**  
`paragraphs`, `callout`, `stats`, `links`, `spots`, `table`, `bullets`, `seasons`, `faq`, `ratings`, `numbered-tips`, `gallery`, `section-image`, `map`, `ticket-link`

**Overlap with `BlogBodyBlock` is partial** (shared callout/table/FAQ/map/ticket/seasons/gallery concepts; different shapes — e.g. rich uses `paragraphs` + `items[]`, section uses `paragraph` + `text`).

### 2.3 CMS / post section models

| Type | File |
|------|------|
| `BlogPost`, `BlogPostSection`, `BlogRelatedResource`, `BlogCardVariant` | `/workspace/src/types/index.ts` |
| `CmsBlogSection`, `CmsBlogBody` | `/workspace/src/types/cms-content.ts` |
| `ContentSection` (guides reuse blocks) | `/workspace/src/types/content-page.ts` |
| `ContentTocItem`, `RelatedContentItem` | `/workspace/src/types/content-reading.ts` |
| `EditorialOverride` | `/workspace/src/data/blog-editorial/types.ts` |

`BlogPostSection` fields: `title`, `body`, optional `blockType?: BlogSectionKind`, optional `blocks?: BlogBodyBlock[]`.

### 2.4 Zod / CMS schema

- **No Zod schemas** for blog/rich blocks found under `src/**` blog/page-builder paths.
- Runtime coercion: `/workspace/src/lib/cms/page-builder/block-normalize.ts` — `normalizeBlogBodyBlock`, `normalizeBlogBodyBlocks`.
- Registry (Payload-like): `/workspace/src/lib/cms/page-builder/block-registry.ts` — `PAGE_BUILDER_BLOCKS`, `PageBuilderBlockSlug`, `PageBuilderBlockGroup`, `PageBuilderBlockDefinition`.
- Patterns: `/workspace/src/lib/cms/page-builder/pattern-registry.ts`.

**Gap:** `season-matrix` / `tourism-infographic` / `tourism-timeline` exist on `BlogBodyBlock` and render in `BlogSectionBody`, but are **not** separate picker entries in `PAGE_BUILDER_BLOCKS` (reachable via typed data or generic `widget`).

---

## 3. Section / block renderers

There is **no** symbol named `BlogSectionRenderer`. Equivalents:

| Component / export | Path | Role |
|--------------------|------|------|
| `BlogSectionBody` + `renderBlogBodyBlock` | `/workspace/src/components/blog/BlogSectionBody.tsx` | Switch over all `BlogBodyBlock` types |
| `resolveBlogSectionBlocks` | `/workspace/src/lib/blog-section-blocks.ts` | Parsed body ⊕ section.blocks ⊕ slug typed overrides |
| `parseBlogSectionBody`, `getBlogSectionKind` | `/workspace/src/lib/blog-section-body.ts` | Markdown-ish → `BlogBodyBlock[]` |
| `BlogPostSectionView` | `/workspace/src/components/blog/BlogPostSectionView.tsx` | Section shell, images, expandable kinds, inline related |
| `BlogRichArticle` | `/workspace/src/components/blog/BlogRichArticle.tsx` | Rich block switch |
| `BlogRichArticleClientBlock` | `/workspace/src/components/blog/BlogRichArticleClientBlocks.tsx` | Client-only table/FAQ/gallery/map |
| `ContentSectionBody` | `/workspace/src/components/content/ContentSectionBody.tsx` | Reuses `renderBlogBodyBlock` for guides |
| `renderPageBuilderBlock` | `/workspace/src/lib/cms/page-builder/render-blocks.ts` | Alias of `renderBlogBodyBlock` |

### Page-builder presentational blocks

`/workspace/src/components/page-builder/blocks/`:

- `BlogAccordionBlock.tsx`
- `BlogAuthorCardBlock.tsx`
- `BlogComparisonTableBlock.tsx`
- `BlogContentEmbedBlock.tsx`
- `BlogCtaBlock.tsx`
- `BlogFactsGridBlock.tsx`
- `BlogGalleryBlock.tsx`
- `BlogImageTextBlock.tsx`
- `BlogInfoboxBlock.tsx`
- `BlogQuoteBlock.tsx`
- `BlogRouteMapBlock.tsx`
- `BlogTourBookingBlock.tsx`
- `BlogVideoBlock.tsx`
- `BlogWidgetBlock.tsx` → `TravelWidgetRenderer`

### Section-level blog UI primitives

`/workspace/src/components/blog/`:

- Callout / lists / tables / FAQ: `BlogCallout.tsx`, `BlogChecklist.tsx`, `BlogStepList.tsx`, `BlogContentTable.tsx`, `BlogFaqSection.tsx`
- Media / maps: `BlogMediaBlock.tsx`, `BlogMapBlock.tsx`, `BlogInlineMapBlock.tsx`, `ArticlePlacesMiniMap.tsx`, `BlogDestinationGallery.tsx`, `BlogRichGalleryCarousel.tsx`
- Widgets: `BlogSeasonWidget.tsx`, `BlogBudgetWidget.tsx`
- CTA / commerce / affiliate: `BlogTicketLink.tsx`, `BlogEngagementCta.tsx`, `BlogAffiliateZone.tsx`, `BlogAffiliateEmbed.tsx`, `BlogNewsletterBlock.tsx`
- Author / related: `BlogAuthorCard.tsx`, `BlogRelatedPosts.tsx`, `BlogInlineRelatedPosts.tsx`, `BlogPostFooterLinks.tsx`
- Layout chrome: `BlogPostView.tsx`, `BlogPostHeader.tsx`, `BlogPostHero.tsx`, `BlogSidebar.tsx`, `BlogQuickFacts.tsx`, `BlogExpandableSection.tsx`, `BlogSectionDivider.tsx`

---

## 4. TravelWidgetRenderer and widget types

**File:** `/workspace/src/components/travel/TravelWidgetRenderer.tsx`  
**Type:** `TravelWidgetKey = "season-matrix" | "tourism-infographic" | "tourism-timeline"`

| Key | Component |
|-----|-----------|
| `season-matrix` | `/workspace/src/components/travel/ArgentinaSeasonMatrix.tsx` |
| `tourism-infographic` | `/workspace/src/components/travel/ArgentinaTourismInfographic.tsx` |
| `tourism-timeline` | `/workspace/src/components/travel/ArgentinaTourismTimeline.tsx` |

Also renderable as first-class `BlogBodyBlock` types with the same names (not only via `widget.widgetKey`).  
Contract test: `/workspace/src/lib/travel-widget-renderer-contract.test.ts`.  
Pilot typed injection: `/workspace/src/data/blog-typed-blocks/index.ts` (`best-time-to-visit-argentina` → `season-matrix`).

---

## 5. Feature → implementation map

| Feature | Section posts (`BlogBodyBlock`) | Rich articles (`BlogRichBlock`) | Notes |
|---------|----------------------------------|----------------------------------|-------|
| Gallery | `gallery` → `BlogGalleryBlock` | `gallery` → client carousel | Also `BlogDestinationGallery`, `BlogRichGalleryCarousel` |
| Photo / media | `media`, `image-text` | `section-image` | Section images via `getDistinctBlogSectionImage` |
| Callout | `callout` (+ parser) | `callout` (`info\|tip\|warning` mapped) | Variant sets differ |
| Accordion | `accordion` | FAQ uses accordion UI | FAQ ≠ generic accordion |
| Tables | `table` | `table` (client) | Parser: tab-separated in `body` |
| Comparison | `comparison-table` | — | Page-builder only for section/CMS |
| FAQ | `faq` / section kind | `faq` block + article-level `faq` | JSON-LD: `BlogFaqJsonLd` |
| Maps | `map`, `route-map`, mini-map aside | `map` | `ArticlePlacesMiniMap` in sidebar |
| CTA | `cta`, `ticket-link`, `tour-booking` | `ticket-link`, `links` | |
| Timeline | `tourism-timeline` / widget | — | Travel widget only |
| Cards | Index `BlogCard`; rich `spots` cards | `RichSpotCard` internal | No generic “card block” in `BlogBodyBlock` |
| Author | `author-card` + footer `BlogAuthorCard` | — | Authors pages under `/blog/authors` |
| Related | inline + sidebar + footer | `buildInlineRelatedForRichArticle` | `RelatedContentCards` |
| Sources | Section title «Источники и дата проверки» (legacy audit / MD) | `updatedLabel` + prose | Not a typed block |

---

## 6. Article layout, TOC, mobile

| Piece | Path |
|-------|------|
| Page entry | `/workspace/src/app/blog/[slug]/page.tsx` — `resolveBlogPost` + `BlogPostView` |
| Article shell | `/workspace/src/components/blog/BlogPostView.tsx` |
| Reading layout | `/workspace/src/components/content/ContentReadingLayout.tsx` |
| TOC | `/workspace/src/components/content/TableOfContents.tsx` — variants `sidebar` \| `mobile` |
| Scroll-spy | `/workspace/src/hooks/useContentTocScrollSpy` (imported by TOC) |
| Rich TOC source | `getBlogRichArticleToc` in `/workspace/src/data/blog-articles/index.ts` |

**Behavior:**

- TOC shown when section count ≥ **4** (`TOC_MIN_SECTIONS` in `BlogPostView`).
- **Mobile:** chip/pill TOC above article (`variant="mobile"`).
- **Desktop:** sticky aside (`lg:grid`) with TOC + `BlogSidebar` + optional map panel; related cards can sit outside the article card.
- Progress: `ArticleReadingProgress` (imported in `BlogPostView`).
- Expandable FAQ/mistakes/checklist/tips: `BlogExpandableSection` via `getBlogSectionKind`.

---

## 7. Editorial JSON / TypeScript content structures

### 7.1 Catalog assembly

**Hub:** `/workspace/src/data/blog.ts`

Pipeline:

1. **Legacy manual posts** inline in `blog.ts` (incl. steak, tango, packing lists, park stubs with `richArticleId`).
2. **`applyLegacyManualEditorialAudit`** — sources, section overrides, quarantines.
3. **MD-synced manuals** — `/workspace/src/data/blog-manual-from-md/*.ts` via `manualPostsFromMd`.
4. **Plan / auto posts** — `/workspace/src/lib/blog-from-plan.ts` + `/workspace/src/data/blog-content-plan` (+ editorial overrides).
5. Image/tour embeds resolution at export time.

### 7.2 Content source trees

| Tree | Path | Structure |
|------|------|-----------|
| Rich TS articles | `/workspace/src/data/blog-articles/*.ts` | `BlogRichArticle` |
| MD→rich sync | `/workspace/docs/*.md` (park titles) → `scripts/sync-blog-rich-articles-from-md.mjs` | |
| MD→section sync | `/workspace/docs/articles/*.md` → `scripts/sync-blog-manual-posts-from-md.mjs` | |
| Editorial overrides | `/workspace/src/data/blog-editorial/{buenos-aires,iguazu,money,northwest,patagonia,...}.ts` | `EditorialOverride` |
| Auto section templates | `/workspace/src/data/blog-content/article-content.ts` | |
| Typed block pilots | `/workspace/src/data/blog-typed-blocks/index.ts` | slug → section title → blocks |
| Seasonality rewrite | `/workspace/src/data/blog-best-time-to-visit-argentina.ts` | |
| Canonical map | `/workspace/src/data/blog-canonical-map.ts` | Class B → pillar |
| Hubs / published slugs | `/workspace/src/data/blog-hubs.ts`, `blog-published-slugs.ts` | |
| KB markdown (not blog renderer) | `/workspace/content/knowledge-base/**/*.md` | Separate KB product |

### 7.3 Post shape (conceptual)

```ts
BlogPost {
  slug, title, excerpt, content,
  sections?: { title, body, blockType?, blocks? }[],
  richArticleId?, // switches renderer to BlogRichArticle
  relatedResources?, relatedDestinations?, tourEmbeds?,
  editorialReviewed?, noIndex?, canonicalSlug?,
  author*, dates, image, category, tags, readTimeMinutes
}
```

---

## 8. Storybook, preview, demo, admin page-builder

| Area | Status | Paths |
|------|--------|-------|
| Storybook / Ladle / Histoire | **Absent** (no scripts, no `*.stories.*`) | — |
| Admin document preview | Yes | `/workspace/src/app/admin/content/documents/[id]/preview/page.tsx` |
| Organizer article preview | Yes | `/workspace/src/app/organizer/articles/[id]/preview/page.tsx` |
| Public blog demo route | **No dedicated demo** | Public `/blog/[slug]` only |
| Visual page builder | Yes | `/workspace/src/components/admin/page-builder/VisualPageBuilder.tsx` |
| Blog section builder wrapper | Yes | `BlogSectionPageBuilder.tsx` |
| Guide builder | Yes | `GuideSectionPageBuilder.tsx` |
| Block UI | Yes | `PageBuilderBlockPicker`, `PageBuilderBlockCard`, `PageBuilderBlockFields`, `SortableBlockList` |
| Wired into CMS editor | Yes | `/workspace/src/components/admin/views/ContentDocumentEditorView.tsx` |
| Organizer editor | Yes | `/workspace/src/components/organizer/OrganizerArticleEditorView.tsx` |
| Architecture doc | Yes | `/workspace/docs/visual-page-builder-architecture.md` |

---

## 9. Existing documentation (editorial / blog)

| Doc | Path |
|-----|------|
| Markup for editors | `/workspace/docs/blog-markup-guide.md` |
| Content/UX audit | `/workspace/docs/blog-content-ux-audit.md` |
| UX/UI roadmap | `/workspace/docs/blog-ux-ui-roadmap.md`, `/workspace/docs/BLOG_UX_ROADMAP.md` |
| Quality / revision | `/workspace/docs/blog-quality-roadmap.md`, `/workspace/docs/blog-revision-proposal.md` |
| Canonical slug map | `/workspace/docs/blog-canonical-map.md` (+ TS twin) |
| Visual page builder | `/workspace/docs/visual-page-builder-architecture.md` |
| Editorial style | `/workspace/docs/content-overhaul/editorial-style-guide.md` |
| Geography glossary | `/workspace/docs/editorial/geography-glossary.md` |
| AI-first content factory | `/workspace/docs/ai-first/CONTENT_FACTORY_ARCHITECTURE.md`, `CONTENT_FACTORY_PROMPT.md` |
| Cursor editorial rule | `/workspace/.cursor/rules/editorial-standard.mdc` |

**Gap:** Until this file, no single `docs/editorial/` system map tying block unions ↔ renderers ↔ content pipelines.

---

## 10. Markdown vs structured blocks — how rendering works

```
body (prose with \n\n + light MD conventions)
        │
        ▼
parseBlogSectionBody(body, title, blockType?)  → BlogBodyBlock[]
        │
        ├── section.blocks? (CMS / TS)
        └── getTypedBlocksForSection(slug, title)  (data overrides)
        │
        ▼
resolveBlogSectionBlocks → BlogSectionBody → renderBlogBodyBlock switch
```

**Parser conventions** (see `docs/blog-markup-guide.md` + `blog-section-body.ts`):

- Callouts: `**Совет:**`, `> [!tip]`, etc.
- Bullets / numbered steps / checklist (`□`, `❌`)
- Tab-separated tables
- FAQ sections by title heuristics or `blockType: "faq"`
- Mistakes sections → mistake callouts

**Rich path:** ignore section `body` parser; load `getBlogRichArticle(richArticleId)` and render typed `BlogRichBlock[]` (some client-hydrated).

**Fallback:** if no sections and no rich — parse `post.content` as a single synthetic section.

**Guides / author articles:** reuse the same `BlogBodyBlock` renderer path.

---

## 11. Legacy slug overrides / CMS overrides

### 11.1 TS legacy editorial audit (`blog.ts`)

- `quarantinedLegacyManualSlugs` (e.g. `blue-dollar-argentina-2026` → `noIndex`)
- `legacyManualOfficialSources`
- `legacyManualExcerptOverrides`
- `legacyManualReplacementSections` (full rewrite, e.g. best-time)
- `legacyManualSectionOverrides` (per-title body replace; steak price section)
- `legacyManualRemovedSections`
- `REPLACED_MANUAL_SLUGS` — `/workspace/src/data/blog-manual-from-md/index.ts` (`buenos-aires-neighborhoods`, `mendoza-wine-route`)

### 11.2 Editorial overrides for plan posts

- `/workspace/src/data/blog-editorial/index.ts` → `EDITORIAL_OVERRIDES`, `getEditorialOverride`
- Many legacy overrides **quarantined** (`publicationReady: false`) unless explicitly marked ready
- Applied in `/workspace/src/lib/blog-from-plan.ts`

### 11.3 Canonical / duplicate handling

- `/workspace/src/data/blog-canonical-map.ts` — e.g. `food-asado` → `argentinian-steak-guide`
- `BlogPost.canonicalSlug` for Class B → pillar SEO

### 11.4 Slug aliasing (Cyrillic ↔ Latin media folders)

- `/workspace/src/lib/blog-slug-resolve.ts` — `blogSlugLookupCandidates`, `canonicalBlogSlug`, `blogPostPath`

### 11.5 CMS overrides

- `/workspace/src/lib/cms/blog-resolver.ts` — `resolveBlogCatalog`, `resolveBlogPost`, `mergeBlogCatalog`
- Cutover flag `cmsBlogCutover` in site globals
- Merge: `blogPostFromCms` in `/workspace/src/types/cms-content.ts`
- Preview merge helpers: `/workspace/src/lib/cms/cms-preview.ts`

### 11.6 Typed data overrides (not CMS)

- `/workspace/src/data/blog-typed-blocks/index.ts` — append blocks by slug + section title

---

## 12. package.json scripts (blog / editorial / audit / media)

Relevant scripts from `/workspace/package.json`:

| Script | Purpose |
|--------|---------|
| `sync-rich-articles` / `:check` | MD parks → `blog-articles` TS |
| `sync-manual-posts` / `:check` | `docs/articles` → `blog-manual-from-md` |
| `blog:editorial-readiness` / `:check` | Editorial readiness gate |
| `guide:editorial-readiness` / `:check` | Guides gate |
| `content:audit` / `content:crawl` / `content:lint` / `content:fix` | Content audit |
| `content:inventory` | Overhaul inventory |
| `content:governance` / `:strict` | Governance |
| `content:public-editorial` | Public editorial audit |
| `content:verify-production` | Smoke + content audit |
| `audit` / `audit:quick` / `audit:security` / `audit:perf` | Engineering audit |
| `audit-images` / `audit-blog-heroes` / `page-image-audit` / `blog-image-perf-audit` | Media audits |
| `lighthouse:blog` / `:ci` | Blog CWV |
| `sync:blog-semantic-heroes` | Semantic heroes |
| `bootstrap-cornerstone-heroes` | Cornerstone heroes |
| `register-cornerstone-media` / `:check` | Media registration |
| `prune-legacy-blog-media` / `:check` | Legacy media prune |
| `media:integrity` / `:prod` / `media:critical:*` / `media:rights:*` | Media integrity/rights |
| `sync-cms-media-manifest` / `cms-media:deploy-check` | CMS media |
| `cms:archive-orphan-blog-slugs` | Orphan CMS slugs |
| `sync-content-plan-redirects` / `:check` | Plan redirects |
| `kb:integrate-argentina-travel:editorial` / `:media` | KB integration |
| `fetch-stock-media` | Stock pull |
| `runtime-text:audit` | Runtime text |

---

## 13. `argentinian-steak-guide` — location and structure

| Item | Detail |
|------|--------|
| URL | `/blog/argentinian-steak-guide` |
| Source of truth | Inline `BlogPost` in `/workspace/src/data/blog.ts` (`id: "2"`, ~lines 150–295) |
| Engine | **Section post** (not `richArticleId`) |
| Category | «Кухня Аргентины» |
| Flags | `editorialReviewed: true`; in `BLOG_START_HERE_SLUGS` |
| Media | `/media/blog/argentinian-steak-guide/` (hero + section slots via manifest / `blog-post-image-bindings`) |
| Tour embeds | `/workspace/src/data/blog-tour-embeds.ts` key |
| Legacy override | `legacyManualSectionOverrides["argentinian-steak-guide"]["Сколько стоит хороший стейк"]` + official sources appendix |
| Canonical for | Class B `food-asado` → this slug |
| MD source | **No** `docs/articles` MD sync for this slug (hand-maintained TS) |

**Sections (titles):** Введение → Почему аргентинская говядина… → Asado → Parrilla → Главные виды… → Bife de Chorizo → Ojo de Bife → Lomo → Vacío → Entraña → Что ещё… → Chorizo → Morcilla → Provoleta → Прожарка (tab table) → Chimichurri → Сколько стоит… → Как едят… → Типичные ошибки… (+ sub-sections) → Часто задаваемые вопросы → Итог → *(injected)* Источники и дата проверки.

**Design-system signals:** FAQ section kind, mistakes kind, tab table in body, bullet lists, callout-worthy tips — good **section-parser** showcase (not rich-block showcase).

---

## 14. Candidate articles for an editorial design-system pilot

Pick 2–3 (recommended set of three + alternates):

### A. Seasonality — `best-time-to-visit-argentina` (strongest widget pilot)

- **TS:** `/workspace/src/data/blog.ts` + rewrite `/workspace/src/data/blog-best-time-to-visit-argentina.ts`
- **Typed blocks:** `season-matrix` in `/workspace/src/data/blog-typed-blocks/index.ts`
- **Why:** Exercises travel widgets, long TOC, replacement sections, start-here pillar.

### B. DNI / documents — `dni-cuil-argentina`

- **TS:** `/workspace/src/data/blog-manual-from-md/dni-cuil-argentina.ts`
- **MD:** `/workspace/docs/articles/Переезд-DNI-и-CUIL-пошагово.md`
- **Why:** Short factual MD→TS pipeline; sources section; immigration category; good for callout/steps/FAQ patterns without rich engine.

### C. Housing / cost of living — `stoimost-zhizni-buenos-aires`

- **TS:** `/workspace/src/data/blog-manual-from-md/stoimost-zhizni-buenos-aires.ts`
- **MD:** `/workspace/docs/articles/Деньги-Стоимость-жизни-Буэнос-Айрес.md`
- **Why:** Practical methodology article; tables/checklist candidates; BA cluster with districts.

### Alternates

| Topic | Slug | Paths |
|-------|------|-------|
| Transport | `kak-dobratsya-v-argentinu`, `vnutrennie-aviabilety-argentina` | `blog-manual-from-md/*`, MD under `docs/articles/Транспорт-*.md` |
| Iguazu (rich) | `natsionalnyy-park-iguasu` + `richArticleId: "iguazu-national-park"` | `/workspace/src/data/blog-articles/iguazu-national-park.ts`, MD `/workspace/docs/Национальный-парк-Игуасу.md` |
| Buenos Aires districts | `buenos-aires-rajony` | `blog-manual-from-md/buenos-aires-rajony.ts`, MD `Города-Буэнос-Айрес-районы.md` |
| Plan/auto housing-ish | `transport-аренда-авто` etc. | Often Class B / plan — prefer manuals above |

**Recommended pilot trio for design system:**  
1) `argentinian-steak-guide` (section parser + FAQ/table/mistakes),  
2) `best-time-to-visit-argentina` (widgets + TOC),  
3) `iguazu-national-park` rich (full `BlogRichBlock` surface) **or** `dni-cuil-argentina` if staying on one engine.

---

## 15. Architecture strengths

1. **Unified public block renderer** for section/CMS/guides (`BlogBodyBlock` + `renderBlogBodyBlock`).
2. **Progressive enrichment:** prose parser → optional typed blocks → slug overrides → CMS merge.
3. **Admin page builder** aligned with Payload-style registry (groups, patterns, normalize, DnD).
4. **Reading UX shared** across blog/guides/destinations (`ContentReadingLayout`, TOC scroll-spy, related cards).
5. **Editorial governance tooling:** readiness scripts, content audits, canonical map, legacy source injection, quarantine flags.
6. **MD checksum sync** for cornerstone manuals and rich parks keeps prose editable outside TS.
7. **Media pipeline** (manifest, semantic heroes, rights, lighthouse) is unusually mature for a content site.

---

## 16. Architecture gaps (for an editorial design system)

1. **Dual block systems** (`BlogBodyBlock` vs `BlogRichBlock`) with divergent variants and incomplete component reuse — highest design-system risk.
2. **No Zod / single schema source of truth** — normalize + TS unions can drift from picker registry (e.g. travel widget types missing from picker).
3. **No Storybook / visual gallery** of blocks — hard to review design tokens across callout/FAQ/table/map.
4. **Parser magic vs explicit blocks** — editors must know MD conventions; `blockType` still optional/heuristic-heavy.
5. **Rich articles bypass page builder** — parks are MD→TS codegen, not CMS blocks.
6. **Multiple override layers** (legacy audit, editorial overrides, typed-blocks, CMS, canonical) — powerful but cognitively heavy; needs an operator matrix in docs.
7. **Cards / timeline / sources** are not first-class design-system blocks for section posts (timeline only via travel widget; sources are a titled section convention).
8. **Steak guide still carries fragile price prose** in the base body (mitigated by override for one section) — good candidate for typed `budget` / callout migration.
9. **`docs/editorial/`** previously only had geography glossary — this audit starts the system map; still missing Figma/token ↔ block mapping.

---

## 17. Key file index (quick reference)

```
Types
  src/types/blog-content-blocks.ts
  src/types/blog-rich-article.ts
  src/types/cms-content.ts
  src/types/index.ts (BlogPost*)
  src/types/content-reading.ts

Parse / resolve
  src/lib/blog-section-body.ts
  src/lib/blog-section-blocks.ts
  src/lib/blog-from-plan.ts
  src/lib/blog-slug-resolve.ts
  src/lib/cms/blog-resolver.ts
  src/lib/cms/page-builder/block-registry.ts
  src/lib/cms/page-builder/block-normalize.ts

Render
  src/components/blog/BlogPostView.tsx
  src/components/blog/BlogSectionBody.tsx
  src/components/blog/BlogRichArticle.tsx
  src/components/content/ContentReadingLayout.tsx
  src/components/travel/TravelWidgetRenderer.tsx

Data
  src/data/blog.ts
  src/data/blog-articles/
  src/data/blog-manual-from-md/
  src/data/blog-editorial/
  src/data/blog-typed-blocks/
  src/data/blog-canonical-map.ts
  docs/articles/*.md
  docs/Национальный-парк-*.md

Admin
  src/components/admin/page-builder/*
  src/app/admin/content/documents/[id]/page.tsx
  src/app/admin/content/documents/[id]/preview/page.tsx
```

---

## 18. Suggested next steps (design system)

1. Publish a **block inventory Figma/Story page** from `PAGE_BUILDER_BLOCKS` + rich-only extras (`stats`, `spots`, `ratings`).
2. Decide **unify or bridge**: map `BlogRichBlock` → `BlogBodyBlock` (or shared primitives) for callout/table/FAQ/gallery/map.
3. Add **Storybook or `/admin/.../block-gallery`** demo route (currently missing).
4. Migrate 1 section post (steak) and 1 widget post (best-time) to **explicit `blocks[]`** while keeping parser fallback.
5. Document the **override precedence matrix** for editors (legacy → editorial → typed-blocks → CMS → cutover).

---

## 19. Decision matrix (компонент → решение)

| Компонент | Текущее состояние | Решение | Совместимость |
|-----------|-------------------|---------|---------------|
| Gallery (`BlogGalleryBlock`) | Работает хорошо (grid) | Сохранить и расширить variants | Полная |
| Rich gallery carousel | Отдельная client-реализация | Объединить через gallery variants + adapter | Через adapter |
| Comparison table | Плохо на mobile (только scroll) | Responsive variants (`cards`/`stacked`/`tabs`/`scroll`) | Через optional `mobileLayout` |
| Accordion | Content в details; FAQ отдельно | Сохранить; FAQ — preferred для Q&A | Сохранить schema |
| Photo / media | Несколько реализаций (`media`, `image-text`, `section-image`, hero) | Унифицировать через `photo` + adapter от `media` | Через migration/alias |
| Map | Точечно (`map`, `route-map`, mini-map) | Вынести в editorial registry | Полная |
| Callout / Infobox | Дублирование вариантов | Системный Callout; infobox → deprecated alias | Через adapter |
| FAQ | details/summary, JSON-LD | Сохранить и доработать deep links | Полная |
| Checklist / Steps | Работают | Сохранить; density + interactive opt-in | Полная |
| Facts grid | Работает | Системный FactGrid | Полная |
| Author card | Inline + footer | Системный AuthorCard | Полная |
| CTA / ticket / tour-booking | Три отдельных типа | ArticleCTA registry + keep aliases | Полная |
| Budget / seasons | Travel widgets | Сохранить; CostBreakdown как расширение budget | Полная |
| Season matrix / tourism widgets | First-class + widget key | Registry widgets only | Полная |
| Sources | Legacy section title prose | Новый `sources` block | Adapter from section |
| Article summary / story deck | Нет | Новый `article-summary` | Новое |
| Phrasebook | Нет | Новый `phrasebook` | Новое |
| Option selector | Нет (steak cuts prose) | Новый `option-selector` | Новое |
| Country tip | Нет | Новый `country-tip` | Новое |
| Pros/cons | Частично seasons | Новый `pros-cons` | Новое |
| Lead / Heading | paragraph + subheading | Lead/Heading wrappers; keep aliases | Через adapter |
| Video | YouTube/Vimeo | Сохранить + consent/lazy | Полная |
| Quote | Есть | Сохранить | Полная |
| TOC | Chip wall на mobile | Доработать collapsible groups | Layout change |
| Rich-only (`spots`, `stats`, `ratings`) | Только parks | Bridge → body primitives / keep rich adapter | Через adapter |
| Legacy slug overrides | Много слоёв | Документировать precedence; не удалять | Полная |

### Источники истины

1. **Публичный рендер секций:** `BlogBodyBlock` + `renderBlogBodyBlock`
2. **CMS normalize:** `normalizeBlogBodyBlock` + `PAGE_BUILDER_BLOCKS`
3. **Rich parks:** `BlogRichBlock` (отдельный pipeline до полной миграции)
4. **Editorial registry (новое):** `src/editorial/registry` — meta-слой, aliases, migration, preview

### Precedence overrides

`section.body` parser → `section.blocks` → `getTypedBlocksForSection(slug, title)` → CMS merge (`resolveBlogPost`) → legacy section body overrides / replacement sections

### Риски миграции

- Dual schema drift (rich vs section)
- Silent null on unknown blocks in renderer
- Price prose / outdated numbers in steak guide
- Travel widgets missing from page-builder picker
- Horizontal table overflow as only mobile strategy
- Chip TOC density on mobile
- No visual gallery for QA of dark mode / density

