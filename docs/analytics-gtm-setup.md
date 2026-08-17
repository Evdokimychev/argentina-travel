# Настройка Google Tag Manager

Код сайта отправляет события в `dataLayer` и управляет **Google Consent Mode v2**. GA4 и Clarity настраиваются **в интерфейсе GTM**; **Яндекс.Метрика** подключается **напрямую в Next.js** (`YandexMetrika.tsx`) — не добавляйте тег Метрики в GTM.

## 1. Переменные окружения

Задайте в Vercel / `.env.local`:

| Переменная | Описание |
|------------|----------|
| `NEXT_PUBLIC_GTM_ID` | ID контейнера GTM (`GTM-XXXXXXX`) — **обязательно** |
| `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | ID потока GA4 (`G-…`) — для справки и тегов в GTM |
| `NEXT_PUBLIC_YANDEX_METRIKA_ID` | Номер счётчика Яндекс.Метрики — **загружается из кода приложения** (production), пример: `110458660` |
| `NEXT_PUBLIC_CLARITY_PROJECT_ID` | ID проекта Microsoft Clarity |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Токен GSC (или в Admin → SEO) |
| `NEXT_PUBLIC_BING_SITE_VERIFICATION` | Токен Bing (`msvalidate.01`) |
| `NEXT_PUBLIC_AHREFS_SITE_VERIFICATION` | Токен Ahrefs |

Проверка env и live-сниппета:

```bash
npm run analytics-readiness
ANALYTICS_BASE_URL=https://www.goargentina.ru npm run analytics-readiness
npm run gtm-events:audit
```

## 2. Consent Mode (уже в коде)

- До согласия: `analytics_storage`, `functionality_storage` — **denied**
- После «Принять всё» или включения «Аналитика» в баннере — **granted**
- Реклама (`ad_*`) всегда **denied**

В GTM для каждого тега аналитики включите **Consent Settings → Require consent → analytics_storage**.

## 3. Теги в GTM

### GA4 Configuration

- **Tag type:** Google Analytics: GA4 Configuration
- **Measurement ID:** `{{NEXT_PUBLIC_GA4}}` или константа `G-XXXXXXXX`
- **Consent:** analytics_storage
- **Trigger:** Consent Initialization — All Pages (или Initialization — All Pages)

### GA4 Event (универсальный)

- **Tag type:** Google Analytics: GA4 Event
- **Configuration Tag:** GA4 Configuration (выше)
- **Event name:** `{{Event}}` (встроенная переменная Event)
- **Trigger:** Custom Event — regex:

```
(booking_submit|booking_start|booking_error|contact_form_submit|newsletter_subscribe|whatsapp_click|telegram_click|tour_booking_click|excursion_booking_click|partner_checkout_click|tour_card_impression|tour_card_click|tour_view|tour_date_select|tour_people_change|excursion_view|blog_article_save|blog_affiliate_click|blog_inline_related_click|blog_article_view|blog_article_feedback|blog_comment_post|blog_affiliate_embed_view|locale_switch|currency_change|search_submit|search_result_click|search_zero_results|public_404|public_503)
```

> Sprint 5: canonical set is **30** events. Legacy aliases `tour_detail_view` / `locale_change` are documented below for historical GA4 reports only — the app no longer dual-fires them.

Дополнительно создайте **GA4 Conversions** в интерфейсе GA4 для:

- `booking_submit`
- `contact_form_submit`
- `newsletter_subscribe`

### Яндекс.Метрика

Счётчик подключается **напрямую в Next.js** (`src/components/analytics/YandexMetrika.tsx`), не через GTM.

1. Задайте `NEXT_PUBLIC_YANDEX_METRIKA_ID=110458660` в Vercel → Settings → Environment Variables → **Production** → Redeploy.
2. Убедитесь, что **нет дублирующего тега Метрики** в контейнере GTM — иначе будут двойные хиты.
3. В настройках счётчика включите Webvisor, карту кликов, карту скроллинга и анализ форм.
4. **Контентная аналитика:** включите опцию «Контентная аналитика» и в поле **«Тип разметки»** выберите **`Schema.org (JSON-LD)`** — на сайте разметка статей реализована через JSON-LD (`Article` / `BlogPosting`), см. раздел ниже.

Инициализация в коде (SPA, `defer: true` + `hit` при навигации):

```javascript
ym(COUNTER_ID, "init", {
  defer: true,
  clickmap: true,
  trackLinks: true,
  accurateTrackBounce: true,
  webvisor: true,
  trackHash: true,
  triggerEvent: true,
});
```

Проверка:

```bash
npm run analytics-readiness
ANALYTICS_BASE_URL=https://www.goargentina.ru npm run analytics-readiness
```

Цели в Метрике (JavaScript-событие, имя = `event` из dataLayer):

| Цель | Событие dataLayer |
|------|-------------------|
| Заявка | `booking_submit` |
| Контакт | `contact_form_submit` |
| Подписка | `newsletter_subscribe` |
| WhatsApp | `whatsapp_click` |
| Telegram | `telegram_click` |
| Клик «Забронировать» (тур) | `tour_booking_click` |
| Клик «Забронировать» (экскурсия) | `excursion_booking_click` |
| Просмотр тура | `tour_view` |
| Просмотр экскурсии | `excursion_view` |
| Сохранение статьи | `blog_article_save` |
| Клик партнёра в статье | `blog_affiliate_click` |
| Клик inline «Читайте также» | `blog_inline_related_click` |
| Просмотр статьи | `blog_article_view` |
| Оценка «полезно» | `blog_article_feedback` |
| Комментарий | `blog_comment_post` |
| Показ affiliate-блока | `blog_affiliate_embed_view` |
| Смена языка | `locale_switch` |
| Поиск по сайту (отправка) | `search_submit` |
| Клик по результату поиска | `search_result_click` |

### Microsoft Clarity

- **Tag type:** Custom HTML

```html
<script type="text/javascript">
(function(c,l,a,r,i,t,y){
  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", "PROJECT_ID");
</script>
```

- **Consent:** analytics_storage
- **Trigger:** All Pages

### Bing / Ahrefs

Верификация через **meta-теги** в `<head>` (Next.js `metadata.verification`), не через GTM. Токены — в env или Admin → Настройки → SEO.

## 4. Google Search Console

1. Добавьте свойство `https://www.goargentina.ru`
2. Подтвердите через meta `google-site-verification` (env или CMS)
3. Отправьте sitemap: **`https://www.goargentina.ru/sitemap.xml`**
4. Проверьте robots: **`https://www.goargentina.ru/robots.txt`** — должен содержать `Sitemap:` и `Allow: /`

## 5. Проверка

1. [Tag Assistant](https://tagassistant.google.com/) — контейнер GTM, consent, срабатывание тегов
2. GA4 DebugView — события после согласия на cookie
3. Метрика → Вебvisor — запись сессии
4. Clarity → Recordings

## 6. Карта dataLayer-событий

Источник правды в коде: `src/lib/analytics/gtm-events.ts`. Тест уникальности и схемы параметров: `src/lib/analytics/gtm-events.test.ts`.

| Событие | Когда | Ключевые поля |
|---------|-------|---------------|
| `booking_submit` | Успешная заявка на тур/экскурсию | `product_type`, `item_id`, `item_name`, `partner`, `guests`, `value`, `currency`, `source` |
| `contact_form_submit` | Форма на `/contacts` | `form_name`, `source`, `tour_slug`, `product_slug`, `service_slug` |
| `newsletter_subscribe` | Подписка в footer / блоке блога | `form_name`, `source` |
| `whatsapp_click` | Клик по ссылке wa.me / whatsapp.com | `link_url`, `link_text`, `channel` |
| `telegram_click` | Клик по t.me / telegram | `link_url`, `link_text`, `channel` |
| `tour_booking_click` | Кнопка «Забронировать» на странице тура | `item_id`, `item_name`, `booking_action`, `placement` |
| `excursion_booking_click` | Кнопка бронирования экскурсии | `item_id`, `item_name`, `booking_action`, `placement` |
| `tour_view` | Просмотр `/tours/[slug]` | `item_id`, `item_name`, `item_category`, `value`, `currency`, `organizer_id` |
| `excursion_view` | Просмотр `/excursions/[slug]` | `item_id`, `item_name`, `item_category`, `partner`, `city_name` |
| `blog_article_save` | Сохранение статьи в «Мои материалы» | `item_id`, `item_name`, `save_action`, `source` |
| `blog_affiliate_click` | Клик по партнёрской ссылке в статье | `item_id`, `affiliate_service`, `link_url` |
| `blog_inline_related_click` | Клик «Читайте также» в теле статьи | `source_slug`, `item_id`, `item_name`, `placement` |
| `blog_article_view` | Просмотр статьи блога | `item_id`, `item_name`, `item_category` |
| `blog_article_feedback` | «Полезно» / «Не помогло» | `item_id`, `item_name`, `feedback_value` |
| `blog_comment_post` | Отправка комментария | `item_id`, `item_name` |
| `blog_affiliate_embed_view` | Показ affiliate-блока (in-view) | `item_id`, `affiliate_service` |
| `locale_switch` | Смена языка в переключателе | `locale_from`, `locale_to`, `page_path` |
| `search_submit` | Отправка запроса в поиске по сайту (⌘K) | `search_query_length`, `results_count`, `search_source`, `search_kind` |
| `search_result_click` | Клик по результату поиска | `search_query_length`, `item_id`, `item_kind`, `position`, `search_source` |
| `tour_card_impression` | Карточка тура попала в viewport | `item_id`, `item_name`, `placement` |
| `tour_card_click` | Клик по карточке тура | `item_id`, `item_name`, `placement` |
| `tour_detail_view` | **Legacy alias** — не отправляется приложением | — |
| `tour_date_select` | Выбор даты на карточке тура | `item_id`, `date_id` |
| `tour_people_change` | Изменение числа туристов | `item_id`, `guests` |
| `partner_checkout_click` | Старт партнёрского checkout | `item_id`, `booking_action`, `placement` |
| `booking_start` | Старт сценария бронирования | `item_id`, `booking_mode`, `placement` |
| `booking_error` | Ошибка отправки заявки | `item_id`, `source`, `error_class` |
| `search_zero_results` | Поиск без результатов | `results_count`, `search_source` |
| `locale_change` | **Legacy alias** — не отправляется приложением | — |
| `currency_change` | Смена валюты | `currency_from`, `currency_to`, `page_path` |
| `public_404` | Публичная страница 404 | `page_path` |
| `public_503` | Soft unavailable / outage UI | `page_path`, `product_id`, `error_class` |

## 7. Контентная аналитика (Яндекс.Метрика)

Метрика собирает статистику по материалам через **Schema.org** или **Open Graph**. На goargentina.ru используется **JSON-LD** (`buildArticleSchema` в `src/lib/schema-json-ld.ts`, сборщики в `src/lib/content-json-ld.ts`).

### Настройка счётчика

1. Метрика → **Настройки** → счётчик → **Контентная аналитика** → **Вкл**
2. **Тип разметки:** **`Schema.org (JSON-LD)`** (не Microdata, не Open Graph)
3. Убедитесь, что установлен **новый код счётчика** (см. `YandexMetrika.tsx`)
4. Отчёты появятся в разделе **Контент** через несколько часов после первых просмотров размеченных материалов (>500 символов текста)

### Обязательные поля JSON-LD (по документации Яндекса)

| Поле | Ключ JSON-LD | Статус на сайте |
|------|----------------|-----------------|
| Идентификатор | `@id` | `{canonicalUrl}#article` |
| Заголовок | `headline` | ✓ |
| Текст | `text` | ✓ (plain text из тела материала) |
| Автор | `author` | ✓ |
| Даты | `datePublished`, `dateModified` | ✓ где есть дата обновления |
| Рубрика | `BreadcrumbList` (отдельный блок) | ✓ на тех же страницах |
| Издатель | `publisher` | ✓ |

### Покрытые страницы

| Раздел | Маршруты | `@type` |
|--------|----------|---------|
| Блог | `/blog/[slug]` | `BlogPosting` |
| Путеводитель (CMS) | `/guide/[slug]` — статьи через `ContentPageView` | `Article` |
| Путеводитель (темы) | `/guide/[slug]` — `GuideTopicView`, pillar-страницы, «Как добраться», «Об Аргентине» | `Article` |
| Иммиграция | `/immigration/[slug]` — статьи и pillar-темы | `Article` |
| База знаний | `/baza-znaniy/[slug]` | `Article` |

**Не размечены как статьи:** каталоги и хабы (`/blog`, `/guide`, `/faq`), карточки туров/экскурсий, служебные страницы.

### Проверка разметки

После деплоя откройте страницу с параметром `?_ym_debug=1` и проверьте консоль браузера — должно появиться сообщение о найденной контентной разметке. Подробнее: [JSON-LD в Метрике](https://yandex.ru/support/metrica/ru/publishers/schema-org/json-ld).

## 8. Публикация контейнера GTM (ручная ops)

Код и env подготавливают `dataLayer`; **Publish в GTM — вручную** после настройки тегов.

Чек-лист перед go-live маркетинга:

- [ ] `NEXT_PUBLIC_GTM_ID` задан в Vercel Production → **Redeploy**
- [ ] GA4 Configuration + универсальный GA4 Event (regex выше)
- [ ] Consent Mode на всех тегах аналитики
- [ ] `NEXT_PUBLIC_YANDEX_METRIKA_ID=110458660` в Vercel Production; **нет** тега Метрики в GTM; цели — в интерфейсе Яндекс.Метрики (таблица выше)
- [ ] В Метрике: **Контентная аналитика** → тип разметки **`Schema.org (JSON-LD)`**
- [ ] Clarity (опционально)
- [ ] **Submit + Publish** контейнера в [tagmanager.google.com](https://tagmanager.google.com/)
- [ ] `npm run gtm-events:audit` — без ошибок
- [ ] `ANALYTICS_BASE_URL=https://www.goargentina.ru npm run analytics-readiness`
- [ ] Tag Assistant + GA4 DebugView на `/`, `/tours`, `/blog`
