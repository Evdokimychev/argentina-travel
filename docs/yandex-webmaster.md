# Яндекс Вебмастер — подключение и SEO goargentina.ru

Чек-лист для команды перед и после подключения сайта в [Яндекс Вебмастер](https://webmaster.yandex.ru/). Кодовая часть уже реализована в проекте; ниже — что проверить вручную в интерфейсе.

## Что уже сделано в коде

| Возможность | Где в проекте |
|-------------|---------------|
| Мета-тег верификации | `src/lib/analytics/site-verification-meta.ts` → `metadata.verification.yandex` в корневом layout |
| Страница верификации | `/yandex-verification` — `src/app/yandex-verification/page.tsx` |
| `robots.txt` + sitemap | `src/app/robots.txt/route.ts`, `src/lib/robots-txt.ts`, `src/app/sitemap.ts` |
| JSON-LD Organization + WebSite | `src/components/seo/SiteJsonLd.tsx` |
| SearchAction (поиск по турам) | `buildWebSiteSchema` в `src/lib/schema-json-ld.ts` |
| Навигационные цепочки (BreadcrumbList) | `src/lib/detail-breadcrumbs.ts`, `BreadcrumbListJsonLd` на детальных и каталожных страницах |
| ItemList основных разделов (главная) | `HomePrimarySectionsItemListJsonLd` — сигнал структуры для быстрых ссылок |
| Канонический домен `www` | `src/lib/site-url.ts` → `https://www.goargentina.ru` |
| Open Graph / title / description | `buildPublicPageMetadata`, корневой `generateMetadata` |
| hreflang (ru, es, en) | `src/lib/i18n/hreflang.ts` на пилотных маршрутах |
| Яндекс Метрика | `YandexMetrikaHeadScripts` в layout |

## 1. Верификация сайта (ручная настройка)

### Шаг 1 — получить код в Вебмастере

1. Добавьте сайт `https://www.goargentina.ru` (именно с `www` — канонический домен проекта).
2. Выберите способ **«Мета-тег»** или **«HTML-файл / страница»**.
3. Скопируйте значение `content` из мета-тега вида `<meta name="yandex-verification" content="…" />`.

### Шаг 2 — сохранить код

Один из вариантов:

- **CMS (предпочтительно):** Админка → Настройки → SEO → поле `yandexSiteVerification`.
- **Переменная окружения:** `NEXT_PUBLIC_YANDEX_SITE_VERIFICATION=<код>` в Vercel / `.env.local`.

После деплоя проверьте:

```bash
curl -s https://www.goargentina.ru/ | grep yandex-verification
curl -s https://www.goargentina.ru/yandex-verification
```

> **Важно:** в репозитории есть резервный код для партнёрской программы Яндекс Дистрибуции (`YANDEX_DISTRIBUTION_VERIFY_CODE`). Для Вебмастера используйте **свой** код из интерфейса — не полагайтесь на встроенный fallback.

## 2. Предпочтительное зеркало (ручная настройка)

В Вебмастере: **Настройки индексирования → Главное зеркало** → выберите `https://www.goargentina.ru`.

Убедитесь, что `NEXT_PUBLIC_SITE_URL=https://www.goargentina.ru` в production (без trailing slash).

## 3. Карта сайта (ручная настройка)

1. Откройте `https://www.goargentina.ru/sitemap.xml` — должен отдавать HTTP 200 и список URL.
2. В Вебмастере: **Индексирование → Файлы Sitemap** → добавьте `https://www.goargentina.ru/sitemap.xml`.
3. Дождитесь статуса «принят» (обычно от нескольких часов до суток).

Приоритетные разделы явно включены в sitemap: `/tours`, `/excursions`, `/guide`, `/immigration`, `/blog`, `/faq`, `/destinations`, `/places`.

## 4. robots.txt

Проверка:

```bash
curl -s https://www.goargentina.ru/robots.txt
```

Ожидается:

- `Allow: /` для `User-agent: *`
- `Disallow` для `/admin/`, `/organizer/`, `/profile/`, `/auth/` и др.
- строка `Sitemap: https://www.goargentina.ru/sitemap.xml`

Если `allowIndexing = false` в CMS — robots закрывает весь сайт (режим staging).

## 5. Микроразметка — проверка в Вебмастере

После индексации нескольких страниц:

1. **Инструменты → Валидатор микроразметки** — проверьте URL:
   - `/` — Organization, WebSite, WebPage, ItemList
   - `/tours/patagonia-glaciers` — Product, BreadcrumbList
   - `/blog/best-time-to-visit-argentina` — Article, BreadcrumbList
   - `/guide/visa-argentina` — BreadcrumbList (цепочка до 3 элементов)
2. Разметка может появиться в сниппетах **в течение ~2 недель** — это нормально для Яндекса.

### Навигационные цепочки (BreadcrumbList)

Требования Яндекса (см. [документацию](https://yandex.ru/support/webmaster/ru/supported-schemas/navigation-links.html)):

- JSON-LD `BreadcrumbList`, поля `name`, `url`/`item`, `position`
- Абсолютные URL на том же домене
- До **3 элементов** в цепочке (реализовано в `buildDetailBreadcrumbItems`)
- Названия элементов ≥ 4 символов

### Быстрые ссылки

Формируются **автоматически** роботом по структуре сайта и поведению пользователей. Помогают:

- чёткое меню (`SITE_NAV_SECTIONS`)
- ItemList основных разделов на главной
- понятные `<title>` страниц
- внутренние ссылки из меню и футера

Управление: **Представление в поиске → Быстрые ссылки** — включение/отключение, выбор названия.

## 6. Что не применимо

| Функция | Статус |
|---------|--------|
| Турбо-страницы | Не используем (Next.js SSR/SSG) |
| Sitelinks Search Box (SearchAction в сниппете) | Яндекс не показывает; разметка оставлена для совместимости и Google site name |
| Принудительные быстрые ссылки через Schema.org | Не поддерживается — только автоматика + настройки в Вебмастере |

## 7. Локальная проверка

```bash
npm run audit:quick          # tsc + lint + unit tests
npm run dev                  # в другом терминале
npm run seo-audit            # sitemap, canonical, JSON-LD на sample-страницах
```

Unit-тесты Yandex/SEO:

- `src/lib/site-sections-json-ld.test.ts`
- `src/lib/schema-json-ld.test.ts`
- `src/lib/detail-breadcrumbs.test.ts`
- `src/lib/yandex-distribution-verify.test.ts`

## 8. Чек-лист после подключения

- [ ] Сайт верифицирован в Вебмастере
- [ ] Главное зеркало: `www.goargentina.ru`
- [ ] Sitemap отправлен и принят
- [ ] Нет критических ошибок в «Диагностика сайта»
- [ ] Валидатор микроразметки: BreadcrumbList без ошибок на `/tours/…`, `/blog/…`
- [ ] Страницы в индексе растут (раздел «Страницы в поиске»)
- [ ] Через 2–4 недели: проверить «Быстрые ссылки» и навигационные цепочки в выдаче

## Ссылки

- [Быстрые ссылки](https://yandex.ru/support/webmaster/ru/search-results/quick-links.html)
- [Навигационные цепочки](https://yandex.ru/support/webmaster/ru/supported-schemas/navigation-links.html)
- [Просмотр и изменение быстрых ссылок](https://yandex.ru/support/webmaster/ru/search-results/quick-links-result.html)
- [Schema.org в Яндексе](https://yandex.ru/support/webmaster/ru/schema-org/what-is-schema-org.html)
- [Общий SEO-аудит проекта](./seo-e78.md)
