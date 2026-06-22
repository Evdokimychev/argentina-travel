# Блог GoArgentina — аудит UX/UI и дорожная карта

Дата аудита: июнь 2026  
Область: `/blog`, `/blog/[slug]`, хабы `/blog/hub/[hubId]`

---

## 1. Сводка аудита

| Область | Текущее состояние | Целевое состояние | Статус |
|--------|-------------------|-------------------|--------|
| Sticky TOC (desktop) | `ContentReadingLayout` + `TableOfContents` | Всегда видимый sticky TOC | ✅ Phase 1 |
| Sticky sidebar | sticky aside + related | Sticky + карта + related | ✅ Phase 1 |
| Author card | `BlogAuthorCard` | Фото, био, ссылка | ✅ Phase 1 |
| Last updated | `dateModified` в шапке и карточках | Везде на индексируемых материалах | ✅ Уже было |
| Reading progress | `ArticleReadingProgress` | Полоса прогресса статьи | ✅ Phase 1 |
| Quick facts | `BlogQuickFacts` | Блок после введения | ✅ Phase 1 |
| Internal linking | `lib/blog-internal-links.ts` | Автоперелинковка по словарям | ✅ Phase 3 (rule-based) |
| Related после секций | `BlogInlineRelatedPosts` | После major-секций, макс. 3 блока | ✅ Phase 2 |
| FAQ accordion | `BlogFaqSection` | Стилизованный accordion | ✅ Уже было |
| Expandable tips | `BlogExpandableSection` | checklist/mistakes/tips | ✅ Phase 2 |
| Share + save | `BlogShareBar` + `BlogSaveArticleButton` | Панель + localStorage | ✅ Phase 3 (local-first) |
| Newsletter | `BlogNewsletterBlock` | Блок в статье | ✅ Phase 1 |
| WhatsApp CTA | `BlogEngagementCta` | Консультация + WhatsApp | ✅ Phase 1 |
| Tour CTA по категории | `blog-category-tours.ts` | Категорийный fallback | ✅ Phase 1 |
| Hero + search (index) | `BlogHeroSearch` | Поиск в hero | ✅ Phase 1 |
| Trending destinations | `BlogTrendingDestinations` | Витрина направлений | ✅ Phase 2 |
| Popular routes | `BlogPopularRoutes` | Блок маршрутов | ✅ Phase 2 |
| Recommended tours (live) | `BlogRecommendedTours` + SSR | Карточки туров с каталога | ✅ Phase 2 |
| Inline maps | `BlogInlineMapBlock` | Lazy Leaflet | ✅ Phase 2 |
| Destination gallery | `BlogDestinationGallery` | Галерея по метаданным/эвристике | ✅ Phase 2 |
| Card imagery 3/2 | `BlogCard` standard | aspect 3/2 | ✅ Phase 2 |
| Topic cluster nav | `BlogTopicClusterNav` + ItemList JSON-LD | Перелинковка хаба | ✅ Phase 3 |
| Affiliate zones | `BlogAffiliateZone` | car-rental / insurance / esim | ✅ Phase 3 |
| Reading history | `BlogReadingHistoryPanel` | localStorage + Supabase sync | ✅ Phase 6 |
| Save article | `useSavedArticles` + store interface | localStorage → будущий Supabase | ✅ Phase 3 (local-first) |

---

## 2. Phase 1 — реализовано

См. предыдущую версию документа. Тесты: `src/lib/blog-post-ux.test.ts`.

---

## 3. Phase 2 — реализовано

| Функция | Файлы |
|---------|-------|
| Related после секций (макс. 3) | `lib/blog-inline-related.ts`, `lib/blog-related-posts.ts` (`getRelatedBlogPostsForSection`), `BlogInlineRelatedPosts.tsx`, `BlogPostSectionView.tsx`, `BlogPostView.tsx` |
| Trending destinations | `BlogTrendingDestinations.tsx`, `BlogIndexView.tsx` |
| Popular routes | `data/blog-popular-routes.ts`, `BlogPopularRoutes.tsx` |
| Inline maps (lazy) | `BlogInlineMapBlock.tsx`, `ArticlePlacesMiniMap.tsx` (`embedded`), `lib/article-map-points.ts` |
| Expandable practical tips | `BlogExpandableSection.tsx`, `BlogPostSectionView.tsx`, `lib/blog-section-body.ts` (`tips`) |
| Live tour embeds на index | `lib/blog-index-tours.ts`, `BlogRecommendedTours.tsx`, `app/blog/page.tsx` |
| Destination gallery | `lib/blog-destinations.ts`, `BlogDestinationGallery.tsx`, `types/index.ts` (`relatedDestinations`) |
| Card imagery 3/2 | `ContentCard.tsx`, `BlogCard.tsx` |

---

## 4. Phase 3 — реализовано (local-first)

| Функция | Файлы |
|---------|-------|
| Save article | `lib/saved-articles-store.ts`, `hooks/useSavedArticles.ts`, `BlogSaveArticleButton.tsx`, `BlogShareBar.tsx` |
| Internal linking | `lib/blog-internal-links.ts`, `BlogLinkifiedText.tsx`, `BlogSectionBody.tsx` |
| Topic cluster engine | `lib/blog-topic-cluster.ts`, `BlogTopicClusterNav.tsx`, `BlogTopicClusterJsonLd.tsx` |
| Affiliate zones | `lib/blog-affiliate-zones.ts`, `BlogAffiliateZone.tsx` |
| Reading history | `lib/blog-reading-history.ts`, `BlogReadingHistoryPanel.tsx`, `BlogReadingHistoryRecorder.tsx`, `BlogSidebar.tsx` |

---

## 5. Phase 4 — реализовано

| Функция | Файлы |
|---------|-------|
| GTM: save / affiliate / inline related / article view | `lib/analytics/gtm-events.ts`, `BlogSaveArticleButton`, `BlogAffiliateZone`, `BlogInlineRelatedPosts`, `BlogReadingHistoryRecorder` |
| Персонализация «Для вас» | `lib/blog-personalized.ts`, `BlogPersonalizedPosts.tsx`, `BlogIndexView.tsx` |
| A/B hero (localStorage) | `lib/blog-hero-variant.ts`, `BlogHeroVariantCopy.tsx` |
| RSS `/blog/feed.xml` | `lib/blog-rss.ts`, `app/blog/feed.xml/route.ts`, `app/blog/page.tsx` (alternate) |
| Архив авторов | `lib/blog-authors.ts`, `app/blog/authors/page.tsx`, `app/blog/authors/[slug]/page.tsx`, `BlogAuthorsGrid.tsx` |
| Rich parity: linkify + expandable tips + inline related | `BlogRichArticle.tsx`, `lib/blog-inline-related-rich.ts`, `BlogPostView.tsx` |
| Hub parity: trending + tours SSR | `BlogHubView.tsx`, `app/blog/hub/[hubId]/page.tsx` |
| Supabase sync saved articles | `lib/saved-articles-server.ts`, `lib/saved-articles-sync.ts`, `app/api/saved-articles/route.ts`, `useSavedArticles.ts` |
| Sitemap: authors + hubs | `lib/sitemap-urls.ts` |

---

## 6. Phase 5 — реализовано

| Функция | Файлы |
|---------|-------|
| CMS preview автоперелинковки | `lib/blog-internal-link-suggestions.ts`, `BlogInternalLinksPreview.tsx`, `ContentDocumentEditorView.tsx` |
| CMS поле `relatedDestinations` | `types/cms-content.ts` (`CmsBlogBody`), редактор блога |
| SSR + API персонализация | `blog-reading-history-cookie.ts`, `app/blog/page.tsx`, `app/api/blog/recommendations/route.ts`, `BlogPersonalizedPosts.tsx` |
| Обратная связь «Было полезно?» | `BlogArticleFeedback.tsx`, `blog-article-feedback-store.ts`, GTM `blog_article_feedback` |
| Affiliate UTM + disclosure | `blog-affiliate-attribution.ts`, `BlogAffiliateZone.tsx` |
| CWV CI расширен | `.github/workflows/ci.yml`, `scripts/lighthouse-blog-cwv.mjs` (+ `/blog/authors`, a11y) |

---

## 7. Phase 6 — реализовано

| Функция | Файлы |
|---------|-------|
| Reading history Supabase sync | `supabase/migrations/20250628000000_blog_ux_phase6.sql`, `lib/blog-reading-history-server.ts`, `lib/blog-reading-history-sync.ts`, `app/api/blog/reading-history/route.ts`, `BlogReadingHistoryRecorder.tsx`, `app/profile/page.tsx` |
| Комментарии + модерация | `blog_article_comments`, `blog_comment_reports`, `lib/blog-comments-server.ts`, `lib/blog-comments-types.ts`, `app/api/blog/comments/*`, `BlogCommentsSection.tsx` |
| Server-side analytics personalization | `lib/blog-analytics-signals.ts`, `getServerPersonalizedBlogPosts`, `app/blog/page.tsx`, `app/api/blog/recommendations/route.ts`; stub `BLOG_ANALYTICS_IMPORT_ENABLED` для Metrika/GA4 |
| Partner affiliate SDK embeds | `lib/blog-affiliate-embeds.ts`, `BlogAffiliateEmbed.tsx`, `BlogAffiliateZone.tsx`, env `NEXT_PUBLIC_LOCALRENT_EMBED_URL`, GTM `blog_affiliate_embed_view` |
| CMS AI suggestions pipeline | `lib/blog-ai-link-suggestions.ts`, `app/api/cms/blog/link-suggestions/route.ts`, `BlogInternalLinksPreview.tsx` (раздел «AI-подсказки») |

Тесты: `src/lib/blog-post-ux.test.ts`, `src/lib/blog-phase6.test.ts`.

---

## 8. Будущие интеграции (Phase 7+)

- Админ-UI очереди модерации комментариев блога (сейчас RLS + reports, без отдельной страницы)
- Полный импорт Metrika/GA4 в `blog-analytics-signals` (env `BLOG_ANALYTICS_IMPORT_ENABLED`)
- Дополнительные partner embeds (страховка, eSIM) по аналогии с LocalRent
- OpenAI-подсказки: кэширование и batch для длинных статей
- Reading history в ЛК туриста (отдельная вкладка профиля)

---

## 9. Метрики успеха (рекомендация)

- CTR на `BlogEngagementCta`, affiliate zones и tour links
- Конверсия `BlogNewsletterBlock`
- Scroll depth для статей с inline related
- Сохранения статей (`BlogSaveArticleButton`) — событие GTM при добавлении

---

## 10. Связанные части проекта

- **Турист:** saved articles + reading history sync; комментарии к статьям (auth); `/profile/favorites`
- **Организатор:** live tours на index → marketplace
- **Админ/CMS:** AI-подсказки перелинковки; модерация комментариев через RLS (`marketplace.moderation`)
- **Аналитика:** GTM save, affiliate, embed view, comment post, article view — триггеры в GTM
