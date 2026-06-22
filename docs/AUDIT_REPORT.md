# AUDIT_REPORT — спринт стабилизации «Пора в Аргентину»

**Дата:** 21 июня 2026  
**Ветка:** `main` (после `59f7ab3`)  
**Приоритет проекта:** стабильность → UX → UI → производительность → SEO → **визуальное превосходство (фаза 2)**  
**Метод:** автоматические скрипты + статический анализ кодовой базы + smoke на production

> **Важно:** в ТЗ указан Payload CMS — в проекте используется **Supabase CMS** (`content_documents`, `cms_media_assets`, `site_settings`). Раздел «CMS» ниже относится к Supabase, не Payload.

> **Спринты 1–4 завершены в коде** (см. §8). Разделы 1–7 — **baseline до стабилизации** (исторический снимок). Актуальное состояние и план «шикарного» сайта — **[AUDIT_REPORT-PHASE2.md](./AUDIT_REPORT-PHASE2.md)** (спринты 5–11).

---

## Executive summary (post-stabilization, 21.06.2026)

| Область | Оценка | Комментарий |
|---------|--------|-------------|
| **Стабильность** | 🟢 | Nav ≤12 indexable; search без noindex; `/map` redirect; card images via manifest |
| **UX** | 🟢 | PageBreadcrumbs на деталках; desktop search; blog tags; excursion map → list |
| **UI каталога** | 🟢 | 0 hotlink pages; placeholders CTA/widget; card CTA cleanup |
| **Блог UX/UI** | 🟢 | Heroes 49/49 indexable; roadmap S7–S14 в коде |
| **Доверие / данные** | 🟢 | S5 trust gate; честные отзывы; Tripster badge; N-01…N-04 сведены |
| **Визуальная витрина** | 🟢 | S6–S11 в коде (home, tours, geo, guide, gallery, collections); ⏳ deploy + visual sign-off |
| **CMS (Supabase)** | 🟢 | Cutover 4/4 lane 100% |
| **SEO / perf** | 🟢 | Metadata hub pages; JSON-LD; Lighthouse CI + phase-2 sample script |
| **Deploy** | 🟡 | S1–11 в коде; **не задеплоены** на production; GTM/GSC — manual |

**Фаза 2 (спринты 5–11):** код и автоматизация закрыты; остаётся production deploy, Lighthouse median на prod и stakeholder visual QA — см. [sprint11-launch-checklist.md](./sprint11-launch-checklist.md).

**Автопроверки (повторный аудит, 21.06.2026):**

```text
npm test                   → 195 pass (32 files), sprint5–11 regression
npm run page-image-audit   → 0 hotlink pages
npm run build              → OK (локально, 720 static pages)
Спринты 5–11               → ✅ в коде
Production (live)          → ⏳ deploy + smoke + Lighthouse lab
```

---

## 1. UX

### 1.1 Навигация и меню

| Проверка | Статус | Детали |
|----------|--------|--------|
| Структура header/footer | ✅ | Единый источник `site-nav.ts` + `site-links.ts` |
| Mega-menu hub-разделы | ✅ | Регионы, экскурсии, блог — label + submenu |
| Мобильный drawer | ✅ | `Header.tsx` + `MobileNavDrawer` |
| **Блог в nav** | ❌ | `blogPosts.map()` — **все 290 постов**, incl. **203 noIndex** черновика |
| **Туры в nav** | ⚠️ | Нет прямого href — только submenu (+1 клик) |
| **Экскурсии compact** | ⚠️ | На `lg–xl` уходит в «Ещё» (+1 клик) |
| Footer vs header | ⚠️ | `/forum` только в footer; `/experts` нигде в nav |
| Две карты | ❌ | Nav → `/mapa-argentina`; `/map` живёт отдельно без redirect |

**Файлы:** `src/data/site-nav.ts:381`, `src/hooks/useSiteNavLayout.ts`, `src/app/map/page.tsx`, `src/app/mapa-argentina/page.tsx`

### 1.2 Хлебные крошки

| Страница | UI crumbs | JSON-LD |
|----------|-----------|---------|
| Blog post / hub | ✅ | ✅ |
| Tours catalog | ❌ | ✅ |
| Excursion catalog / detail | ❌ / back only | частично |
| Destination / place / guide | ❌ | частично |
| Immigration | ❌ | — |

**Проблема:** JSON-LD есть, UI нет — пользователь не видит путь; на blog post последний crumb — категория, не заголовок (`blog-breadcrumbs.ts:40`).

### 1.3 Поиск

| Слой | Реализация | Проблема |
|------|------------|----------|
| Site-wide | `SiteSearch.tsx`, Meilisearch → Postgres FTS → static | Desktop: иконка только mobile header; FAB + ⌘K |
| Blog catalog | Локальный фильтр `BlogSearchFilters` | Не связан с site search |
| Excursions / places / map | Отдельные панели | Фрагментированный UX |
| Static index | `site-search-index.ts` | **Включает noIndex черновики** (203 шт.) |

### 1.4 Карточки

| Компонент | Проблема |
|-----------|----------|
| `BlogCard.tsx` | `post.image` — часто `/logo-light.svg` после CMS cutover; hero на странице статьи другой |
| `BlogCard.tsx` | Теги не кликабельны (нет `?tag=`) |
| `ExcursionCard.tsx` | Дублирующая кнопка «Открыть» поверх overlay-link |
| `MarketplaceTourCard.tsx` | То же — overlay + «Смотреть тур» |

### 1.5 Формы и CTA

| Форма | Статус |
|-------|--------|
| Contact, newsletter, booking | ✅ Работают |
| Podbor (квиз маршрута) | ✅ localStorage → `/tours` |
| Shop checkout | ⚠️ Ручная обработка менеджером |
| Forum posting | ⚠️ Требует auth — возможный тупик |
| `BlogCtaBlock` | ⚠️ Пустой CMS-блок → `null` (дыра в статье) |
| `GuideWidgetSlot` | ⚠️ Нереализованные виджеты скрыты без placeholder |
| Excursion map mode | ❌ Stub → Google Maps (`ExcursionCatalogMapStub.tsx`) |

### 1.6 Неудобные сценарии (summary)

1. Mega-menu «Последние публикации» = 290 ссылок, scroll unusable.  
2. Поиск черновиков Class-B в site search.  
3. Карточка блога с логотипом → низкое доверие, клик всё равно ведёт на полноценную статью.  
4. Две карты без связи.  
5. Excursion catalog «карта» — внешний redirect.

---

## 2. UI

### 2.1 Типографика и сетка

| Проверка | Статус |
|----------|--------|
| Design tokens / Tailwind | ✅ Единый стиль |
| `siteContainerClass` | ✅ Контейнер на большинстве страниц |
| Шрифты | ✅ `next/font` Unbounded + system, `display: swap` |
| Guide tables mobile | ⚠️ `overflow-x-auto` + `min-w-[480px]` — ожидаемый scroll |

### 2.2 Адаптивность

| Область | Замечание |
|---------|-----------|
| Header utility bar | `hidden md:grid` — на mobile только drawer |
| Catalog toolbar chips | `overflow-x-auto` — OK с scrollbar-hide |
| Organizer tables | `min-w-[920px]` — horizontal scroll в кабинете (не public) |
| Blog featured card | `sizes="100vw"` на wide — OK |

### 2.3 Визуальные дефекты (приоритетные)

| ID | Дефект | Где |
|----|--------|-----|
| UI-01 | **Логотип вместо hero на карточках блога** | `BlogCard` + CMS `post.image` |
| UI-02 | Featured vs standard — один featured на экран OK, но при logo-картинке featured выглядит «сломанным» | `BlogIndexView` |
| UI-03 | Пустой CTA-блок в статье (нулевая высота) | `BlogCtaBlock.tsx` |
| UI-04 | Guide pillar — 4 равнозначные CTA-кнопки | `GuidePillarCta.tsx` |
| UI-05 | `/tours` — 27 Unsplash hotlinks в seed data (внешние URL в src) | `src/data/tours.ts` |

### 2.4 z-index / overlay

| Паттерн | Статус |
|---------|--------|
| Card overlay link z-0 + buttons z-20 | ✅ Рабочий паттерн |
| Site search FAB | ✅ `fixed` поверх контента |
| Auth modal | ✅ Radix dialog |

**Горизонтальный scroll на body:** явных `w-screen` / `100vw` overflow на public pages не найдено; локальный scroll только в таблицах и toolbar.

---

## 3. Контент

### 3.1 Блог

| Метрика | Значение |
|---------|----------|
| Всего постов в каталоге | 290 |
| Indexable (Class A) | 87 |
| noIndex / Class-B черновики | 203 |
| Cornerstone MD (ручные) | 15 |
| Rich national parks | 14+ |
| Hero audit (strict) | ✅ 49/49 indexable heroes on disk |

### 3.2 Изображения

| Проблема | Масштаб |
|----------|---------|
| Карточки блога — logo fallback | Все CMS-posts без `seo.image` |
| Stale slug в manifest/stock-cache | `buenos-aires-neighborhoods`, `mendoza-wine-route` (есть redirect, но manifest дубли) |
| CMS uploads (`cms:*`) в manifest | **0 записей** — upload на prod не sync без `sync-cms-media-manifest` |
| `/tours` hotlinks | 27 Unsplash URL в view data |
| Global Unsplash refs in src | 150 in 20 files (`page-image-audit.md`) |

### 3.3 Slug и дубликаты

| Тип | Статус |
|-----|--------|
| Legacy blog slugs | ✅ 301 via `content-plan-url-redirects` + Supabase `url_redirects` |
| Canonical map Class-B | ✅ `blog-canonical-map.ts` |
| Duplicate map routes | ❌ `/map` + `/mapa-argentina` |
| Valdes MD stub | ⚠️ Полная статья только в TS |

### 3.4 Экскурсии / туры

| Проверка | Статус |
|----------|--------|
| Tripster/Sputnik8 sync | Зависит от env keys |
| Excursion catalog | Smoke OK |
| Tour images | Seed hotlinks — не локальные файлы |

---

## 4. CMS (Supabase)

> Не Payload. Коллекции = `content_documents` по `doc_type`.

### 4.1 Архитектура

```
content_documents (Postgres)
  → resolvers (blog/guide/destination/place)
  → blogPostFromCms() → post.image = seo.image ?? fallback ?? /logo-light.svg
  → getBlogPostHeroResolved() → manifest.json + page-registry (отдельная цепочка)
```

### 4.2 Cutover

| Lane | Coverage | Cutover |
|------|----------|---------|
| blog | 100% | ✅ |
| guide | 100% | ✅ |
| destination | 100% | ✅ |
| place | 100% | ✅ |

### 4.3 Почему изображения не отображаются

| Причина | Решение (спринт) |
|---------|------------------|
| `post.image` ≠ hero resolver | Унифицировать card image через `resolveBlogPostCardImage` / manifest |
| CMS upload без `blogPostSlug` | Bind slug при upload или `seo.image` = public URL |
| Manifest не sync на Vercel | `CMS_MEDIA_SKIP_MANIFEST_SYNC` + commit manifest после sync |
| Stale slug в manifest | Cleanup + `register-cornerstone-media` pattern |
| `isCmsDocumentComplete` не проверяет media | Добавить warning в readiness panel |
| `SafeImage` onError → серый placeholder | Выглядит как «нет картинки» без диагностики |

### 4.4 Кеширование

| Кеш | TTL | Риск |
|-----|-----|------|
| `site.features` (cutover) | 60s in-process | Низкий |
| `manifest.json` | Build bundle | Нужен redeploy после sync |
| Supabase storage CDN | 1 year | Старый URL после replace |
| Sitemap | `revalidate: 3600` | Runtime Supabase dependency |

---

## 5. SEO

### 5.1 Что работает

- `buildPublicPageMetadata()` — title, description, canonical, OG, Twitter (большинство страниц)
- `robots.ts` — CMS-gated indexing, корректный disallow
- Dynamic `sitemap.xml` — ~1253 URL, blog priority, i18n pilot
- JSON-LD — Organization, WebSite, Article+speakable, FAQ, BreadcrumbList
- Blog noIndex для Class-B
- Security headers (HSTS, X-Frame-Options) в `next.config.ts`

### 5.2 Ошибки и пробелы

| ID | Severity | Проблема | Файлы |
|----|----------|----------|-------|
| SEO-01 | P0 | Дубль `/map` и `/mapa-argentina` | `map/page.tsx`, sitemap только второй |
| SEO-02 | P1 | Immigration hub — неполные OG/hreflang | `immigration/page.tsx` |
| SEO-03 | P1 | JSON-LD `image` может быть relative | `schema-json-ld.ts` |
| SEO-04 | P1 | Collections/itineraries/contacts — нет полного OG | respective pages |
| SEO-05 | P2 | `mapa-argentina` без i18n sitemap variants | `sitemap-locales.ts` |
| SEO-06 | P2 | GTM + verification meta отсутствуют на prod | Vercel env |
| SEO-07 | P2 | hreflang overwrite canonical на home/blog/excursions | pattern in page.tsx |

---

## 6. Производительность

### 6.1 Build и bundle

| Проверка | Результат |
|----------|-----------|
| `next build` | ✅ OK (после sitemap `force-dynamic`) |
| `serverExternalPackages` | Supabase, react-pdf |
| Dynamic imports | MapLibre, catalogs — `ssr: false` |
| Bundle analyzer | ❌ Не настроен |

### 6.2 Core Web Vitals

| Tool | CI | Статус |
|------|-----|--------|
| `lighthouse:blog` | `SKIP_LIGHTHOUSE=1`, continue-on-error | **Не enforced** |
| `blog-image-perf-audit` | ✅ CI step | PASS |
| Blog hero preload | ✅ `fetchPriority="high"` on post page | — |

### 6.3 Риски LCP / CLS / INP

| Риск | Детали |
|------|--------|
| LCP | Blog hero — preload OK; card grid with logo — не LCP critical |
| CLS | `SafeImage` blur placeholder — OK |
| INP | `BlogRichArticle` client component — большая hydration surface |
| MapLibre | ~290 lines client bundle on map pages |
| Две map implementations | Дублирование JS |

---

## 7. Приоритизация проблем

### P0 — критические (Спринт 1)

| ID | Категория | Проблема | Impact |
|----|-----------|----------|--------|
| **P0-01** | UX/Content | Nav «Последние публикации» = 290 постов incl. 203 noIndex | Н unusable menu, SEO leak drafts |
| **P0-02** | UI/Content | Blog cards show `/logo-light.svg` after CMS cutover | Broken visual trust, «битые» превью |
| **P0-03** | Content/CMS | Hero resolver ≠ card image (`post.image` vs manifest) | Inconsistent media across surfaces |
| **P0-04** | UX/SEO | `/map` и `/mapa-argentina` без redirect | Duplicate content, user confusion |
| **P0-05** | UX | Site search indexes noIndex drafts | Users find unpublished content |
| **P0-06** | Content | Stale manifest/stock-cache slugs (neighborhoods, wine-route) | Wrong/missing images for renamed posts |
| **P0-07** | CMS | CMS media uploads not in deployed manifest | Images missing after CMS upload on prod |

### P1 — важные (Спринт 2–3)

| ID | Категория | Проблема |
|----|-----------|----------|
| P1-01 | UX | No UI breadcrumbs on tour/excursion/destination/place/guide detail |
| P1-02 | UX | Excursions hidden in compact nav (overflow «Ещё») |
| P1-03 | UX | Desktop search discoverability (no header search field) |
| P1-04 | UX | Excursion catalog map mode stub → external Google Maps |
| P1-05 | UI | `/tours` Unsplash hotlinks (27) — external deps, LCP risk |
| P1-06 | UI | Empty BlogCtaBlock / hidden GuideWidgetSlot without fallback |
| P1-07 | UI | Redundant card CTA buttons (excursion/tour) |
| P1-08 | SEO | Incomplete metadata on immigration, collections, contacts |
| P1-09 | SEO | JSON-LD absolute image URLs |
| P1-10 | CMS | `isCmsDocumentComplete` ignores media readiness |
| P1-11 | Content | 150 Unsplash refs in src — migration to local manifest |
| P1-12 | UX | Blog card tags not linked to filters |
| P1-13 | UX | Tours nav label not direct link to `/tours` |
| P1-14 | UX | `/experts` orphan page (no nav entry) |

### P2 — желательные (Спринт 4)

| ID | Категория | Проблема |
|----|-----------|----------|
| P2-01 | SEO | GTM + GSC/Bing/Ahrefs verification (env + publish) |
| P2-02 | Perf | Enforce Lighthouse CWV in CI (remove SKIP_LIGHTHOUSE) |
| P2-03 | Perf | Bundle analyzer + MapLibre budget |
| P2-04 | SEO | i18n sitemap for mapa-argentina |
| P2-05 | UX | Unify search silos (blog/excursion/places → site search) |
| P2-06 | UI | GuidePillarCta — primary vs secondary hierarchy |
| P2-07 | Content | Valdes MD stub → full sync |
| P2-08 | UX | Forum posting UX for anonymous users |
| P2-09 | SEO | hreflang/canonical overwrite audit on home/blog/excursions |
| P2-10 | Perf | Reduce BlogRichArticle client hydration (RSC split) |

---

## 8. План спринтов

### Спринт 1 — Критические ошибки (стабильность)

**Цель:** нет «сломанных» превью, нет мусора в nav/search, один канонический map URL.

| # | Задача | ID | Файлы / команды |
|---|--------|-----|-----------------|
| 1.1 | Nav: только indexable posts, limit 8–12 + «Все статьи» | P0-01 | `site-nav.ts` |
| 1.2 | Card image: `resolveBlogPostCardImage` в CMS merge / BlogCard | P0-02, P0-03 | `cms-content.ts`, `blog-resolver.ts`, `BlogCard.tsx` |
| 1.3 | Search: filter `filterIndexableBlogPosts` in static index | P0-05 | `site-search-index.ts` |
| 1.4 | Redirect `/map` → `/mapa-argentina` (301) | P0-04 | `next.config.ts` or middleware |
| 1.5 | Cleanup stale manifest + stock-cache slugs | P0-06 | `manifest.json`, `stock-cache.json` |
| 1.6 | Document + script: CMS media sync in deploy checklist | P0-07 | `production-launch-runbook.md`, CI optional step |
| 1.7 | Smoke: assert blog card has non-logo image on sample URLs | — | `production-smoke.mjs` |

**Критерий готовности:** nav ≤12 blog links; sample blog cards show hero; search без noIndex; `/map` redirects; `publish:verify` pass.

**Статус (21.06.2026):** ✅ **Завершён**

| Задача | Статус |
|--------|--------|
| 1.1 Nav limit 12 indexable | ✅ |
| 1.2–1.3 Card image via manifest | ✅ `blogPostFromCms` + `resolveBlogPostCardImage` |
| 1.3 Search filter noIndex | ✅ |
| 1.4 Redirect `/map` | ✅ `next.config.ts` |
| 1.5 Legacy manifest/stock-cache | ✅ `prune-legacy-blog-media.mjs` |
| 1.6 CMS media deploy checklist | ✅ `cms-media:deploy-check`, runbook §2.1 |
| 1.7 Smoke hero + redirect | ✅ `production-smoke.mjs`, e2e smoke |

---

### Спринт 2 — UI

**Цель:** визуально чистые карточки, адаптив, без hotlinks на public catalog.

| # | Задача | ID |
|---|--------|-----|
| 2.1 | Migrate `/tours` seed images to local manifest | P1-05 |
| 2.2 | BlogCtaBlock placeholder when misconfigured | P1-06 |
| 2.3 | GuideWidgetSlot «coming soon» stub | P1-06 |
| 2.4 | Remove redundant excursion/tour card buttons | P1-07 |
| 2.5 | Audit mobile header utility links | UI |
| 2.6 | Guide table responsive card fallback (optional) | UI |

**Критерий:** `page-image-audit` — 0 hotlink pages; visual QA on 375px / 768px / 1280px.

**Статус (21.06.2026):** ✅ **Завершён**

| Задача | Статус |
|--------|--------|
| 2.1 `/tours` seed → manifest resolver | ✅ `tours.ts` без Unsplash; `getTourCoverImage` / `getTourGallery` |
| 2.2 BlogCtaBlock placeholder | ✅ dashed placeholder при пустых label/href |
| 2.3 GuideWidgetSlot «скоро» | ✅ `GuideWidgetComingSoon` для calculator/map/promo/tour-embed |
| 2.4 Redundant card buttons | ✅ overlay-link only в `ExcursionCard`, `MarketplaceTourCard` |
| 2.5 Mobile utility links | ✅ `SITE_NAV_UTILITY_LINKS` в drawer footer (< md) |
| 2.6 Guide table card fallback | ✅ `PillarTableMobileCards` + table на md+ |

---

### Спринт 3 — UX

**Цель:** понятная навигация, крошки, поиск, CTA.

| # | Задача | ID |
|---|--------|-----|
| 3.1 | Shared `PageBreadcrumbs` on detail pages | P1-01 |
| 3.2 | Blog post breadcrumb — title as last crumb | P1-01 |
| 3.3 | Excursions in compact nav primary | P1-02 |
| 3.4 | Header search trigger on desktop | P1-03 |
| 3.5 | Excursion map mode — inline list fallback vs external stub | P1-04 |
| 3.6 | Blog card tag → `?tag=` links | P1-12 |
| 3.7 | Tours nav direct href `/tours` | P1-13 |
| 3.8 | Add `/experts` to nav or noindex | P1-14 |
| 3.9 | GuidePillarCta hierarchy | P2-06 |

**Критерий:** e2e smoke + manual walkthrough 5 user journeys (blog→tour, excursion book, guide pillar, podbor, contact).

**Статус (21.06.2026):** ✅ **Завершён**

| Задача | Статус |
|--------|--------|
| 3.1 Shared `PageBreadcrumbs` | ✅ tour, excursion, destination, place, guide, expert |
| 3.2 Blog breadcrumb → title | ✅ `buildBlogPostUiBreadcrumbs` |
| 3.3 Excursions in compact nav | ✅ `SITE_NAV_COMPACT_PRIMARY_IDS` |
| 3.4 Desktop header search | ✅ кнопка поиска на всех breakpoints |
| 3.5 Excursion map → inline list | ✅ `ExcursionCatalogMapNotice` + grid |
| 3.6 Blog card tag links | ✅ `/blog?tag=` + URL sync |
| 3.7 Tours nav direct href | ✅ `href: "/tours"` |
| 3.8 `/experts` in nav | ✅ ABOUT_LINKS |
| 3.9 GuidePillarCta hierarchy | ✅ primary tour, secondary WA/consult, link immigration |

---

### Спринт 4 — SEO и производительность

**Цель:** полные meta, CWV baseline, analytics.

| # | Задача | ID |
|---|--------|-----|
| 4.1 | Complete metadata on immigration, collections, contacts | P1-08 |
| 4.2 | Absolute URLs in JSON-LD images | P1-09 |
| 4.3 | GTM env + container publish + GSC sitemap | P2-01 |
| 4.4 | Lighthouse CWV in CI (staging URL) | P2-02 |
| 4.5 | `@next/bundle-analyzer` report | P2-03 |
| 4.6 | BlogRichArticle RSC split | P2-10 |
| 4.7 | Remaining Unsplash → local (batch) | P1-11 |

**Критерий:** `analytics-readiness` 0 fail; Lighthouse perf ≥90 on 3 blog URLs; bundle report in docs.

**Статус (21.06.2026):** ✅ **Завершён** (код + CI; GTM/GSC — manual на Vercel)

| Задача | Статус |
|--------|--------|
| 4.1 Metadata immigration/collections/contacts | ✅ `buildPublicPageMetadata` + hreflang |
| 4.2 JSON-LD absolute images | ✅ `resolvePublicUrl` в Article/Trip/Destination |
| 4.3 GTM env + GSC | ✅ `.env.example` + `analytics-readiness` (deploy manual) |
| 4.4 Lighthouse CWV CI | ✅ `lighthouse-ci.mjs`, 3 URL, без SKIP_LIGHTHOUSE |
| 4.5 Bundle analyzer report | ✅ `@next/bundle-analyzer`, `bundle:report` → docs |
| 4.6 BlogRichArticle RSC split | ✅ server shell + `BlogRichArticleClientBlocks` |
| 4.7 Unsplash batch | ✅ guide-topics, places-seed, organizer-tours, patagonia cover |

---

## 9. Команды мониторинга

```bash
# Полный gate
npm run publish:verify
npm run publish:verify:full

# По областям
npm run cms:readiness -- --strict
npm run audit-blog-heroes -- --strict
npm run register-cornerstone-media:check
npm run blog-image-perf-audit
npm run page-image-audit
ANALYTICS_BASE_URL=https://www.goargentina.ru npm run analytics-readiness

# Smoke
SMOKE_BASE_URL=https://www.goargentina.ru npm run production-smoke
PLAYWRIGHT_BASE_URL=https://www.goargentina.ru npm run test:e2e:smoke

# CWV (нужен running server)
LIGHTHOUSE_BASE_URL=http://127.0.0.1:3000 npm run lighthouse:blog
```

---

## 10. Связанные документы

| Документ | Назначение |
|----------|------------|
| [production-launch-runbook.md](./production-launch-runbook.md) | Деплой под ключ |
| [page-image-audit.md](./page-image-audit.md) | Аудит изображений по страницам |
| [cms-checkpoint-eg-analytics.md](./cms-checkpoint-eg-analytics.md) | CMS cutover checkpoint |
| [blog-quality-roadmap.md](./blog-quality-roadmap.md) | Контентный backlog |
| [blog-ux-ui-roadmap.md](./blog-ux-ui-roadmap.md) | UX/UI блога S7–S14 |
| [AUDIT_REPORT-PHASE2.md](./AUDIT_REPORT-PHASE2.md) | Фаза 2: premium UI, спринты 5–11 |
| [audit-goargentina-etap-1.md](./audit/audit-goargentina-etap-1.md) | Доверие, факты, туры |
| [i2-analytics-gsc-runbook.md](./i2-analytics-gsc-runbook.md) | GTM + GSC |

---

## 11. Следующий шаг

1. **Deploy:** спринты 1–4 → production, `npm run sync-content-plan-redirects`, smoke, GTM/GSC (`i2-analytics-gsc-runbook.md`).
2. **Фаза 2:** [AUDIT_REPORT-PHASE2.md](./AUDIT_REPORT-PHASE2.md) — спринты **5–11** (trust → premium home → tours → карта → guide → design system → финальный QA).

*Стабилизация (спринты 1–4) завершена в коде. Повторный аудит и план «шикарного» сайта — в PHASE2.*

### Changelog

| Дата | Спринт | Изменения |
|------|--------|-----------|
| 2026-06-21 | — | Первичный аудит, план P0–P2, спринты 1–4 |
| 2026-06-21 | 1 | ✅ Завершён: nav, search, map redirect, CMS card images, manifest prune, cms-media deploy check, smoke |
| 2026-06-21 | 2 | ✅ Завершён: tours local images, BlogCtaBlock/GuideWidgetSlot placeholders, card CTA cleanup, mobile utility nav, pillar table cards |
| 2026-06-21 | 3 | ✅ Завершён: PageBreadcrumbs, blog tag links, compact nav excursions, desktop search, map list fallback, tours/experts nav, GuidePillarCta hierarchy |
| 2026-06-21 | 4 | ✅ Завершён: metadata, JSON-LD images, Lighthouse CI, bundle report, BlogRichArticle RSC, Unsplash batch |
| 2026-06-21 | — | Повторный аудит → [AUDIT_REPORT-PHASE2.md](./AUDIT_REPORT-PHASE2.md): спринты 5–11, видение premium UI |
