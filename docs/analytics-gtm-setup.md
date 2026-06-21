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
- **Trigger:** Custom Event — regex `(booking_submit|contact_form_submit|newsletter_subscribe|whatsapp_click|telegram_click|tour_booking_click|excursion_booking_click|tour_view|excursion_view)`

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

| Событие | Когда | Ключевые поля |
|---------|-------|---------------|
| `booking_submit` | Успешная заявка на тур/экскурсию | `product_type`, `item_id`, `item_name`, `value`, `guests` |
| `contact_form_submit` | Форма на `/contacts` | `tour_slug`, `product_slug`, `service_slug` |
| `newsletter_subscribe` | Подписка в footer | `source` |
| `whatsapp_click` | Клик по ссылке wa.me / whatsapp.com | `link_url`, `channel` |
| `telegram_click` | Клик по t.me / telegram | `link_url`, `channel` |
| `tour_booking_click` | Кнопка «Забронировать» на странице тура | `item_id`, `booking_action`, `placement` |
| `excursion_booking_click` | Кнопка бронирования экскурсии | `item_id`, `booking_action` |
| `tour_view` | Просмотр `/tours/[slug]` | `item_id`, `item_name`, `value` |
| `excursion_view` | Просмотр `/excursions/[slug]` | `item_id`, `partner`, `city_name` |
