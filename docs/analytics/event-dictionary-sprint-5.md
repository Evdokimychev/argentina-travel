# Sprint 5 — словарь продуктовых событий

Дата контракта: 16 июля 2026. Источник правды в коде: `src/lib/analytics/event-contract.ts`, `gtm-events.ts`, `product-events.ts`.

## Общий контракт

Каждое клиентское событие отправляется только после согласия `analytics=true` и получает единый envelope:

| Поле | Тип | Правило |
|---|---|---|
| `event` | snake_case | Один пользовательский шаг — одно имя события. |
| `event_version` | number | Текущая версия `3`. |
| `event_id` | string | Новый случайный ID каждой отправки; используется для контроля дублей. |
| `session_id` | string | Анонимный ID одной вкладки/сессии из `sessionStorage`; не user ID. |
| `occurred_at` | ISO timestamp | Клиентское время события. |
| `product_id` | string | Стабильный slug/ID предложения, одинаковый на detail, booking и outcome. |
| `product_type` | enum | `tour`, `excursion`, `flight`, `article`, `place`, `service`. |
| `source` | string | Placement/канал входа без контактных данных. |
| `booking_mode` | enum | `native_request`, `partner_external`, `affiliate_redirect`, `information_only`, `payment_link`. |
| `outcome` | enum | `started`, `native_success`, `partner_redirect`, `fallback`, `error`, `cancelled`, `confirmed`. |

Поля `email`, `phone`, имя контакта, сообщение, адрес, паспортные данные и вложенные объекты запрещены. Email- и phone-подобные строки заменяются на `[redacted]`; у URL удаляются query и hash. Параметры — только плоские scalar-значения.

## Основная воронка

| Шаг | Текущее событие | Обязательные измерения | Интерпретация |
|---|---|---|---|
| Discovery | landing/session source в GA4 | `session_id`, acquisition source | Вход на сайт; отдельное custom `page_view` приложение не отправляет. |
| Detail | `tour_view`, `excursion_view` | `product_id`, `product_type`, `session_id` | Уникальный просмотр предложения. |
| Booking start | `tour_booking_click`, `excursion_booking_click` | `product_id`, `booking_mode`, `source`, `outcome=started` | Пользователь начал доступный на странице путь. |
| Native request persisted | `booking_submit` | `booking_mode=native_request`, `outcome=native_success` | API/DB вернули созданную заявку; это ещё не подтверждённая поездка. |
| Partner handoff | `booking_submit` | `booking_mode=partner_external`, `outcome=partner_redirect`, `partner` | Получен partner checkout и выполнен handoff. |
| Affiliate fallback | `booking_submit` | `booking_mode=affiliate_redirect`, `outcome=fallback`, `partner` | Основной partner order не создан, открыт безопасный affiliate URL. |
| Error | продуктовые `booking_*` с `outcome=error` | `product_id`, `booking_mode`, `error_category` | Контракт готов; вызовы на всех error-ветках требуют отдельной интеграции Sprint 6. |
| Confirmed | `booking_confirmed` | `product_id`, `booking_mode`, `outcome=confirmed` | Только подтверждённый CRM/partner факт, не клик и не редирект. |

`booking_submit` нормализует уже существующие источники: `checkout_modal` → native success; `partner_booking`/`excursion_booking` с внешним partner → partner redirect; `partner=platform|native|internal` → native success; source с `fallback` → fallback. Для новых call sites предпочтительны явные `bookingMode` + `outcome`. Это сохраняет совместимость с текущим GTM и добавляет единые измерения.

## Остальные события по возможностям продукта

- Контент: `blog_article_view`, `blog_article_save`, `blog_article_feedback`, `blog_comment_post`, `blog_affiliate_click`, `blog_affiliate_embed_view`, `blog_inline_related_click`, а также продуктовые `article_opened`, `article_depth`, `related_content_clicked`.
- Поиск и карта: `search_submit`, `search_result_click`, `site_search_started`, `site_search_completed`, `site_search_zero_results`, `map_opened`, `map_marker_selected`, `map_filter_changed`, `map_zero_results`.
- Перелёты: `airport_selected`, `airport_route_selected`, `flights_search_started`, `flights_widget_ready`, `flights_widget_error`, `flights_results_opened`.
- Аккаунт/турист: `signup_started`, `signup_completed`, `profile_completed`, `favorite_added`, `itinerary_started`, `review_submitted`.
- Организатор/admin: события onboarding, draft, submit, publish, moderation, booking response, payout и operational tasks из `PRODUCT_EVENT_NAMES`.
- Лиды: `contact_form_submit`, `newsletter_subscribe`, `whatsapp_click`, `telegram_click`.

## Контракт page_view

- Приложение не отправляет custom-событие `page_view` в `dataLayer`.
- GA4 должен иметь ровно одного владельца page view: Enhanced Measurement/history change в GA4, без второго History Change тега в GTM.
- Яндекс.Метрика отправляет первый hit один раз и затем один hit на изменившийся SPA URL; защита — `__goArgentinaYmFirstHitSent` и сравнение предыдущего URL.
- GTM Preview/GA4 DebugView должны показать один `page_view` на загрузку и один на SPA-переход. Это ручное доказательство, пока контейнер не предоставлен.

## Extension contract Sprint 6/7

Следующие события согласованы со следующими потоками разработки, но ещё не добавлены в runtime enum и не считаются реализованными:

| Event | Поля без PII |
|---|---|
| `booking_capability_view` | `product_type`, `product_id` (slug), `booking_mode`, `payment_mode`, `source`, `confirmation_mode`, `support_owner`, `data_freshness`, `placement` |
| `booking_transition` | `outcome=native_request_created|partner_order_created|partner_handoff|disabled`, `partner`, `fallback_reason`, `placement`, `operation_id` |
| `booking_error` | `stage=capability|validation|submit|redirect|confirmation`, `retryable`, `support_owner`, `http_status_class`, `partner` |
| `inventory_update_rejected` | стабильный entity/product ID, reason category, actor role; без raw payload |
| `moderation_conflict` | стабильный entity ID, conflict category, actor role; без текста формы |

При интеграции Sprint 6/7 slug передаётся как единый `product_id`; `operation_id` — технический idempotency/operation ID, не booking contact и не partner URL.

## Незакрытый security blocker

Production `analytics_events` нельзя считать доверенным KPI-источником: текущие RLS migrations разрешают прямой INSERT ролям `anon` и `authenticated`, включая произвольные `metadata` и `session_id`. Серверный writer теперь валидирует плоский PII-free envelope, но Data API обходит его.

После нормализации migration history отдельная rehearsed migration должна:

1. удалить policy `analytics_events_anon_insert`;
2. отозвать `INSERT` у `anon` и `authenticated`;
3. выдать запись только `service_role`;
4. направить браузерные события в ограниченный server ingestion с allowlist, rate limit и schema validation.

До этого `trustedForKpi=false` зафиксирован в `src/lib/analytics/ingestion-security.ts`.
