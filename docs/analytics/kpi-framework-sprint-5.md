# Sprint 5 — KPI framework и weekly review

## Решение, которое поддерживает система

Еженедельно отвечать на три вопроса: доходят ли пользователи от detail до намерения бронировать; завершается ли доступный booking path; где потери вызваны ошибкой или fallback, а не отсутствием спроса.

Исторический production baseline недоступен. На 16 июля 2026 в `analytics_events` была одна строка `assistant_ask`, ноль `tour_view` и `booking_started`. Существующий admin funnel при отсутствии views подставляет оценку из bookings + inquiries; такую величину нельзя называть наблюдаемой конверсией и нельзя использовать для target setting.

## North Star

**Weekly verified booking outcomes** — число уникальных пар `session_id + product_id`, завершившихся `native_success` или проверенным `confirmed`. `partner_redirect` показывается отдельно как handoff, а не как бронирование.

## Основные KPI

| KPI | Формула | Зачем | Owner | Cadence |
|---|---|---|---|---|
| Detail → booking start | unique `(session_id, product_id)` с booking click / unique `(session_id, product_id)` с detail view | Показывает понятность предложения и CTA. | Product owner | weekly, 7d и 28d |
| Booking path completion | unique starts с `native_success` или `partner_redirect` / unique booking starts | Показывает техническую и UX-проходимость доступного пути. Разрез обязателен по `booking_mode`. | Product + Engineering | weekly; alert daily |
| Verified outcomes | unique native requests, подтверждённые DB, плюс реально импортированные partner confirmations | Ближайшая к бизнес-результату метрика без превращения редиректа в продажу. | Product/Operations | weekly |

### Driver metrics

- Detail reach: unique detail sessions / qualified landing sessions, по acquisition source и product type.
- Native request confirmation: DB confirmed / persisted native request.
- Partner handoff mix: partner redirects / all completed paths; не трактовать как partner sales.

### Guardrails

- Error rate = `outcome=error` / booking starts; отдельно client/API/partner category.
- Fallback rate = `outcome=fallback` / partner starts; рост требует проверки partner API.
- Data quality: duplicate `event_id` < 1%, PII findings = 0, missing `product_id`/`booking_mode`/`outcome` = 0 для booking events.
- Consent: до согласия analytics network/events = 0; после revoke новые события = 0.

## Targets

Фиксированные продуктовые targets пока не обоснованы: нет четырёх недель стабильных событий, нет внешнего partner confirmation feed, production GTM/GA4 state не подтверждён. Первый target — измерительный gate, а не желаемая конверсия:

1. 14 дней подряд без PII и double page view.
2. ≥99% booking событий с `session_id`, `product_id`, `booking_mode`, `outcome`.
3. После 4 полных недель owner фиксирует median baseline и ставит квартальную цель отдельно для native и partner путей.

Нельзя задавать одну общую conversion target: native success означает сохранённую заявку, partner redirect — только передачу пользователя партнёру.

## Weekly readout

Owner готовит отчёт каждый понедельник за предыдущие 7 дней и сравнение с 28-дневным baseline:

1. Статус данных: consent coverage, duplicate/PII/schema checks, trusted sources.
2. Три KPI: значение, WoW, 28d baseline, разрез native/partner/fallback.
3. Два крупнейших drop-off по абсолютному числу сессий.
4. Guardrails и incidents.
5. Одно решение на неделю: owner, действие, ожидаемый metric movement, срок.

Любая карточка с `data_status != trusted` показывает `нет достоверных данных`, а не оценённый conversion percent.
