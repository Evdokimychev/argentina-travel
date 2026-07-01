# Настройка Google Tag Manager

Код сайта отправляет события в `dataLayer` и управляет **Google Consent Mode v2**. Сами счётчики (GA4, Метрика, Clarity) настраиваются **в интерфейсе GTM** — без правок кода при смене ID.

## 1. Переменные окружения

Задайте в Vercel / `.env.local`:

| Переменная | Описание |
|------------|----------|
| `NEXT_PUBLIC_GTM_ID` | ID контейнера GTM (`GTM-XXXXXXX`) — **обязательно** |
| `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | ID потока GA4 (`G-…`) — для справки и тегов в GTM |
| `NEXT_PUBLIC_YM_COUNTER_ID` | Номер счётчика Яндекс.Метрики |
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
(booking_submit|contact_form_submit|newsletter_subscribe|whatsapp_click|telegram_click|tour_booking_click|excursion_booking_click|tour_view|excursion_view|blog_article_save|blog_affiliate_click|blog_inline_related_click|blog_article_view|blog_article_feedback|blog_comment_post|blog_affiliate_embed_view|locale_switch)
```

Дополнительно создайте **GA4 Conversions** в интерфейсе GA4 для:

- `booking_submit`
- `contact_form_submit`
- `newsletter_subscribe`

### Яндекс.Метрика

- **Tag type:** Custom HTML или шаблон community «Yandex Metrica»
- **Counter ID:** номер счётчика
- Параметры инициализации:

```javascript
ym(COUNTER_ID, "init", {
  clickmap: true,
  trackLinks: true,
  accurateTrackBounce: true,
  webvisor: true,
  ecommerce: "dataLayer"
});
```

- **Consent:** analytics_storage
- **Trigger:** All Pages (после consent)

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

## 7. Публикация контейнера GTM (ручная ops)

Код и env подготавливают `dataLayer`; **Publish в GTM — вручную** после настройки тегов.

Чек-лист перед go-live маркетинга:

- [ ] `NEXT_PUBLIC_GTM_ID` задан в Vercel Production → **Redeploy**
- [ ] GA4 Configuration + универсальный GA4 Event (regex выше)
- [ ] Consent Mode на всех тегах аналитики
- [ ] Метрика + цели по таблице выше
- [ ] Clarity (опционально)
- [ ] **Submit + Publish** контейнера в [tagmanager.google.com](https://tagmanager.google.com/)
- [ ] `npm run gtm-events:audit` — без ошибок
- [ ] `ANALYTICS_BASE_URL=https://www.goargentina.ru npm run analytics-readiness`
- [ ] Tag Assistant + GA4 DebugView на `/`, `/tours`, `/blog`
