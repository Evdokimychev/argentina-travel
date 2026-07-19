# Sprint 5 — dashboard schema и ops runbook

## Dashboard schema

Фильтры: period (`7d`, `28d`, custom), `product_type`, `booking_mode`, `partner`, `source`, device, locale. Основной grain — одна уникальная пара `session_id + product_id` на шаг воронки; техническая дедупликация — `event_id`.

| Блок | Метрики | Source of truth | Data status |
|---|---|---|---|
| Acquisition | sessions, detail reach | GA4 после consent | `manual_setup_required` |
| Detail | unique tour/excursion views | normalized browser events | `instrumented_not_baselined` |
| Booking start | unique starts, start rate | normalized click events | `instrumented_not_baselined` |
| Outcomes | native success, partner redirect, fallback, error | browser event + native bookings DB | `partial` |
| Confirmed | native confirmed; partner confirmed отдельно | booking DB / future partner reconciliation | native only |
| Quality | duplicate IDs, missing dimensions, PII rejects, double page views | validation query + DebugView | `manual_evidence_required` |

Не объединять в один numerator: `native_success`, `partner_redirect`, `fallback`, `confirmed`. Для partner revenue/confirmed показывать `N/A`, пока нет подтверждённого partner feed.

### Минимальная модель данных панели

```text
event_id, event_name, event_version, occurred_at
session_id, product_id, product_type
source, booking_mode, outcome, partner
device_class, locale, error_category
consent_state, ingestion_source, data_status
```

Admin funnel использует только события с `ingestion_source=controlled_server`. Исторические строки
`legacy_unverified` не участвуют в KPI; подстановка просмотров из заявок или обращений запрещена.

## Локальная проверка перед внешней настройкой

```bash
npm run analytics-readiness
npm run gtm-events:audit
npx vitest run src/lib/analytics src/lib/cookie-consent.test.ts
```

Проверить вручную в браузере:

1. Очистить localStorage/cookie, открыть сайт — GTM, Метрика, Clarity, Vercel Analytics не отправляют network requests.
2. Разрешить analytics — загрузчики появляются, событие detail имеет version/session/product IDs.
3. Отозвать analytics через настройки — Consent Mode получает `denied`, Метрика destruct, новые app events не появляются.
4. Проверить native success, partner redirect и принудительный fallback на staging; реальные платные заказы не создавать.

## Внешние действия владельца

Статус GTM, GA4, GSC, Bing, Ahrefs и Clarity в этом спринте не подтверждён — доступ к их интерфейсам не предоставлен.

### GTM/GA4

1. Задать production IDs в Vercel и выполнить controlled redeploy.
2. На всех analytics tags требовать `analytics_storage`.
3. Настроить GA4 variables для общего envelope и booking dimensions.
4. Оставить один механизм page view: GA4 Enhanced Measurement history events; не создавать второй custom History Change `page_view` tag.
5. Обновить regex custom events по словарю и опубликовать версию контейнера с owner/version note.
6. Сохранить Tag Assistant evidence: denied, granted, revoke, SPA navigation, native, partner, fallback.

### Яндекс.Метрика и Clarity

1. Метрика подключается только приложением после analytics consent; не дублировать тегом GTM.
2. Убедиться, что `YandexMetrikaHeadScripts` не подключён в layout: head bootstrap обошёл бы consent gate.
3. Clarity tag — только с required `analytics_storage`; проверить прекращение новых requests после revoke/reload.

### Search verification

1. Проверить production meta tokens GSC/Bing/Ahrefs после redeploy.
2. Отправить production sitemap в GSC/Bing и сохранить статус/дату/owner.
3. Не считать наличие env или meta доказательством успешной внешней верификации.

## Analytics ingestion boundary

Миграция `20260717047000_analytics_readiness_truth.sql` закрепляет границу:

```sql
drop policy if exists analytics_events_anon_insert on public.analytics_events;
revoke insert on table public.analytics_events from anon, authenticated;
grant insert, select on table public.analytics_events to service_role;
```

Browser ingestion проходит через server endpoint с allowlist, scalar schema, PII sanitizer,
rate limit и дедупликацией по `event_id`. Пять operations-событий проверяются отдельным строгим
словарём без identity/contact полей. Production применять только после staging negative test
прямого Data API INSERT и проверки, что старые строки остаются `legacy_unverified`.

## Exit evidence

- Автоматически: denied-by-default, revoke stops app events, PII sanitizer, единый envelope, booking outcome normalization, no custom `page_view` contract.
- Требует staging: end-to-end native/partner/fallback/error evidence.
- Требует владельца внешних систем: GTM publish, GA4 DebugView, Tag Assistant, GSC/Bing/Ahrefs verification.
- Требует staging: применение migration и negative test прямого Data API INSERT.
