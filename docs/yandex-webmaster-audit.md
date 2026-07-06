# Аудит goargentina.ru по рекомендациям Яндекс Вебмастера

**Дата:** 6 июля 2026  
**Домен:** `https://www.goargentina.ru`  
**Стек:** Next.js 15, RU-first, информационный туристический портал + каталог туров

Источники: [индексирование](https://yandex.ru/support/webmaster/ru/recommendations/indexing), [навигационные цепочки](https://yandex.ru/support/webmaster/ru/supported-schemas/navigation-links.html), [быстрые ссылки](https://yandex.ru/support/webmaster/ru/search-results/quick-links.html), [Clean-param](https://yandex.ru/support/webmaster/ru/robot-workings/clean-param.html), [качество сайта](https://yandex.ru/support/webmaster/ru/yandex-indexing/webmaster-advice), [ЭПОС](https://yandex.ru/support/webmaster/ru/epos).

---

## Матрица соответствия

| Область | Статус | Комментарий |
|---------|--------|-------------|
| Верификация (мета-тег) | ⚡ | Код в `site-verification-meta.ts`; нужен свой код из Вебмастера в CMS/env |
| Главное зеркало `www` | ✅ | `getSiteUrl()` → `https://www.goargentina.ru` |
| robots.txt | ✅ | `src/app/robots.txt/route.ts` + Clean-param для Yandex |
| sitemap.xml | ✅ | Динамический; приоритетные хабы + **база знаний** (267+ URL) |
| 404 + noindex | ✅ | `not-found.tsx`: HTTP 404, `robots: noindex, follow`, полезные ссылки |
| Canonical URL | ✅ | `buildPublicPageMetadata`, `metadataBase`; фильтры каталога → `/tours`, `/places` |
| hreflang (ru/es/en) | ⚡ | Пилот на ключевых разделах; `/faq`, `/flights`, `/baza-znaniy` без локалей (RU-only контент) |
| Title / description | ✅ | На публичных страницах; улучшено описание `/faq` |
| Open Graph / Twitter | ✅ | Корневой layout + `buildPublicPageMetadata`; KB получила OG |
| JSON-LD Organization + WebSite | ✅ | `SiteJsonLd.tsx` |
| SearchAction | ✅ | `/tours?query={search_term_string}` |
| BreadcrumbList (≤3 элемента) | ✅ | Туры, блог, guide, immigration, places, forum, **база знаний** |
| ItemList разделов (главная) | ✅ | `HomePrimarySectionsItemListJsonLd` |
| FAQPage schema | ✅ | `/faq` |
| Article / Product / Event | ✅ | Блог, туры, экскурсии |
| noindex фасетных URL | ✅ | `/tours?…`, `/places?…`, `/baza-znaniy/poisk`, черновики блога |
| Внутренняя перелинковка | ✅ | `SITE_NAV_SECTIONS`, футер, хабы, KB |
| Быстрые ссылки | ⚡ | Автоматика Яндекса; сигналы усилены ItemList + меню |
| Яндекс Метрика | ✅ | Production |
| Турбо-страницы | — | Не применимо (SSR/SSG) |
| Скорость / Core Web Vitals | ⚡ | `next/image`, `display: optional` для шрифтов; whitelabel-виджеты — отдельный риск LCP |
| Мобильная версия | ✅ | Viewport, responsive layout |
| ЭПОС / качество контента | ⚡ | Редакционный контент + KB; требует ручного мониторинга в Вебмастере |
| Clean-param (UTM, gclid…) | ✅ | Добавлено в robots.txt для `User-agent: Yandex` |

**Легенда:** ✅ реализовано в коде · ⚡ частично / ручная настройка · ❌ пробел · — не применимо

---

## Исправления в коде (этот аудит)

| Файл | Изменение |
|------|-----------|
| `src/lib/robots-txt.ts` | Генератор robots.txt с Disallow и **Clean-param** для Yandex |
| `src/app/robots.txt/route.ts` | Замена `robots.ts` — поддержка Clean-param |
| `src/app/not-found.tsx` | `metadata`: title, description, `robots: noindex` |
| `src/lib/catalog-seo.ts` | Фильтры: noindex + canonical `/tours` (без query) |
| `src/lib/places-catalog-seo.ts` | Аналогично для `/places` |
| `src/lib/sitemap-urls.ts` | Sitemap: `/baza-znaniy`, разделы, все статьи KB |
| `src/lib/site-sections-json-ld.ts` | `/baza-znaniy` в `YANDEX_PRIORITY_HUB_PATHS` |
| `src/lib/detail-breadcrumbs.ts` | Секции `forum`, `knowledgeBase`; `buildForumThreadBreadcrumbItems` |
| `src/app/forum/**` | BreadcrumbList JSON-LD на индексе, категории, теме |
| `src/app/baza-znaniy/**` | OG, WebPage JSON-LD, BreadcrumbList JSON-LD |
| `src/app/faq/page.tsx` | Расширенное meta description для сниппета |
| `src/lib/knowledge-base/kb-breadcrumbs-json-ld.ts` | Обрезка цепочки до 3 элементов (Yandex) |
| Тесты | `robots-txt`, `catalog-seo`, `kb-breadcrumbs-json-ld`, `detail-breadcrumbs` |

---

## Ручная настройка в Яндекс Вебмастере

### Обязательно

1. **Добавить сайт** `https://www.goargentina.ru` (с `www`).
2. **Верификация** — мета-тег или `/yandex-verification`; код в CMS → SEO → `yandexSiteVerification` или `NEXT_PUBLIC_YANDEX_SITE_VERIFICATION`.
3. **Главное зеркало** → `https://www.goargentina.ru`.
4. **Sitemap** → `https://www.goargentina.ru/sitemap.xml` → дождаться статуса «принят».
5. **Проверить robots.txt** в интерфейсе — должна быть секция `User-agent: Yandex` с `Clean-param`.

### После первой индексации

6. **Диагностика сайта** — устранить критические ошибки.
7. **Валидатор микроразметки** — проверить URL:
   - `/` — Organization, WebSite, WebPage, ItemList
   - `/tours/patagonia-glaciers` — Product, BreadcrumbList
   - `/blog/best-time-to-visit-argentina` — Article, BreadcrumbList
   - `/baza-znaniy/<slug>` — BreadcrumbList, WebPage
   - `/forum/<category>` — BreadcrumbList (если форум включён)
8. **Индексирование → Исключённые страницы** — убедиться, что `/tours?query=…`, `/places?region=…`, `/baza-znaniy/poisk` не попадают в индекс как дубли.
9. **Представление в поиске → Быстрые ссылки** — через 2–4 недели после роста трафика; при необходимости включить/переименовать.
10. **Мониторинг «Страницы в поиске»** — контроль роста KB, guide, blog.

### Рекомендуется

11. **Переобход** — после деплоя этого аудита запросить переобход `/`, `/baza-znaniy`, `/sitemap.xml`.
12. **ИКС** — следить в разделе «Качество сайта»; для информационного проекта важны ЭПОС-факторы (оригинальность KB, guide).
13. **Метрика** — цели: просмотр guide, KB, заявка на тур (сверить с `YandexMetrikaHeadScripts`).

---

## Проверка локально

```bash
npm run audit:quick          # tsc + lint + unit tests
npm run dev                  # в другом терминале
npm run seo-audit            # sitemap, canonical, JSON-LD на sample-страницах
```

**robots.txt (без dev-сервера не проверить HTTP):**

```bash
curl -s http://127.0.0.1:3000/robots.txt | head -20
# Ожидается: User-agent: Yandex + Clean-param: utm_source&…
```

**404:**

```bash
curl -sI http://127.0.0.1:3000/nonexistent-page | grep HTTP
curl -s http://127.0.0.1:3000/nonexistent-page | grep 'noindex'
```

**Sitemap KB:**

```bash
curl -s http://127.0.0.1:3000/sitemap.xml | grep -c baza-znaniy
# Ожидается: 260+ вхождений
```

---

## Известные ограничения (не исправлялись автоматически)

| Тема | Причина |
|------|---------|
| hreflang на `/faq`, `/flights`, `/baza-znaniy` | Контент RU-only; hreflang без перевода — риск «incorrect hreflang» |
| SearchAction в сниппете Яндекса | Яндекс не показывает; разметка для Google |
| Excursions catalog filters | Нет отдельного noindex-модуля (Tripster-каталог); при росте фасетов — добавить по аналогии с tours |
| LCP whitelabel `/flights` | Сторонний скрипт Aviasales; оптимизация отдельной задачей |
| Forum в sitemap | Зависит от Supabase feature flag; URL добавляются через nav/footer при включении |
| 2 падающих unit-теста (`sort-tours`, `youtravel/partner-tour-details`) | Существовали до аудита; не связаны с SEO |

---

## Связанные документы

- [Чек-лист подключения Вебмастера](./yandex-webmaster.md)
- [SEO-аудит E78](./seo-e78.md)
