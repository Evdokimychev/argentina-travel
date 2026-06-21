# Отчёт: веб-аналитика через Google Tag Manager

**Дата:** 21 июня 2026  
**Сайт:** goargentina.ru  
**Статус:** код интегрирован; счётчики активируются после заполнения env и публикации контейнера GTM.

---

## Установленные сервисы

| Сервис | Способ подключения | ID (заполнить в env / GTM) |
|--------|-------------------|----------------------------|
| **Google Tag Manager** | Snippet в `<head>` + loader `afterInteractive` | `NEXT_PUBLIC_GTM_ID` → `GTM-XXXXXXX` |
| **Google Analytics 4** | Тег в GTM | `NEXT_PUBLIC_GA4_MEASUREMENT_ID` → `G-XXXXXXXX` |
| **Яндекс.Метрика** | Тег в GTM (Webvisor, карта кликов, карта скроллинга) | `NEXT_PUBLIC_YM_COUNTER_ID` → `XXXXXXXX` |
| **Microsoft Clarity** | Тег Custom HTML в GTM | `NEXT_PUBLIC_CLARITY_PROJECT_ID` |
| **Google Search Console** | Meta verification + sitemap | `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` |
| **Bing Webmaster Tools** | Meta `msvalidate.01` | `NEXT_PUBLIC_BING_SITE_VERIFICATION` |
| **Ahrefs Webmaster Tools** | Meta `ahrefs-site-verification` | `NEXT_PUBLIC_AHREFS_SITE_VERIFICATION` |

Токены верификации также доступны в **Admin → Настройки → SEO по умолчанию**.

---

## GDPR / Cookie Consent

- Баннер cookie (категории: необходимые, аналитика, персонализация)
- **Google Consent Mode v2**: теги аналитики заблокированы до согласия
- GTM загружается асинхронно (`afterInteractive`), без блокировки рендера
- Vercel Analytics / Speed Insights — только после согласия на аналитику

---

## Sitemap и robots

| URL | Назначение |
|-----|------------|
| `https://www.goargentina.ru/sitemap.xml` | Динамический sitemap (туры, экскурсии, блог, guide и др.) |
| `https://www.goargentina.ru/robots.txt` | `Allow: /`, `Disallow` для кабинетов; строка `Sitemap:` |

Отправьте sitemap в GSC и Bing Webmaster после верификации.

---

## Отслеживаемые события (dataLayer)

| Событие | Конверсия | Описание |
|---------|-----------|----------|
| `booking_submit` | ✅ | Отправка заявки на тур или экскурсию |
| `contact_form_submit` | ✅ | Контактная форма `/contacts` |
| `newsletter_subscribe` | ✅ | Подписка на рассылку (footer) |
| `whatsapp_click` | ✅ | Клик по WhatsApp (делегирование по всему сайту) |
| `telegram_click` | ✅ | Клик по Telegram |
| `tour_booking_click` | ✅ | Клик «Забронировать» на странице тура |
| `excursion_booking_click` | ✅ | Клик по кнопке бронирования экскурсии |
| `tour_view` | — | Просмотр страницы тура |
| `excursion_view` | — | Просмотр страницы экскурсии |

---

## Следующие шаги (вручную)

1. Создать контейнер GTM и скопировать `GTM-XXXXXXX` в env
2. Настроить теги по инструкции [`docs/analytics-gtm-setup.md`](./analytics-gtm-setup.md)
3. Опубликовать контейнер GTM
4. Верифицировать домен в GSC, Bing, Ahrefs
5. Отметить конверсии в GA4 и цели в Метрике
6. Проверить через Tag Assistant и DebugView

---

## Изменения в коде

- `src/lib/analytics/*` — config, events, consent, verification meta
- `src/components/analytics/*` — GTM loader, consent script, messenger tracker
- `src/components/SiteAnalytics.tsx` — GTM + Vercel Analytics
- `src/hooks/useInteractionTracking.ts` — GTM page views для туров/экскурсий
- Формы и бронирование — вызовы `track*` при успехе / клике
- `src/types/site-globals.ts` — поля верификации в SEO globals
