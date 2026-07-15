# Inventory внешних и инфраструктурных интеграций

Дата: 2026-07-15
Scope: код, локальная конфигурация без чтения значений, публичное production-поведение. Секреты в документ не копировались.

## Статусы

- `active-confirmed` — пользовательская production-поверхность и полезный ответ подтверждены.
- `active-unverified-flow` — поверхность активна, но финальная транзакция Agent 2 не выполнялась.
- `configured-local` — обязательные локальные переменные присутствуют; production не доказан.
- `fallback-only` — основной API не настроен или не подтверждён, есть честный внешний fallback.
- `prepared` — adapter/backend существует, но активное публичное использование не подтверждено.
- `dormant` — не должен обещаться или показываться как рабочий до readiness evidence.

## Партнёрские travel-интеграции

| Интеграция | Назначение | Кодовый путь | Локальная конфигурация | Production evidence | Fallback / владелец | Тесты | Статус |
|---|---|---|---|---|---|---|---|
| Tripster | Экскурсии, partner tours, schedule/price, External Orders | `src/lib/tripster`, `/api/tripster`, `/api/excursions` | Partner + secret присутствуют | `/api/excursions` вернул наполненный ответ; order не создавался | Affiliate booking URL; checkout, оплата, отмена и support у Tripster | Booking API, URL, pipeline, partner invariants | `active-unverified-flow` |
| Travelpayouts Links API | Affiliate wrapping и attribution | `src/lib/travelpayouts/client.ts`, `/api/affiliate/go/[slug]` | API key, marker, TRS присутствуют | Partner disclosures видимы; конкретный redirect не выполнялся | При ошибке нельзя терять query/prefill; раскрыть внешний переход | Client/partner URL tests | `configured-local` |
| Travelpayouts whitelabel / Aviasales | Поиск авиабилетов | `/flights`, `/embed/flights/wl`, whitelabel config | `NEXT_PUBLIC_TRAVELPAYOUTS_WL_ID` локально не найден | Страница доступна; живой поиск не подтверждён | Внешний поиск/checkout у Aviasales | Widget lifecycle/responsive tests | `active-unverified-flow` |
| Travelpayouts insurance | Расчёт/переход к страховой | `/insurance`, insurance config | Использует общий TP config; WL ID не найден локально | Страница и disclosure доступны | Расчёт, оплата, полис у партнёра | Отдельный E2E не найден | `active-unverified-flow` |
| YouTravel.me catalog/booking | Партнёрские многодневные туры | `src/lib/youtravel`, `/api/youtravel/booking-request` | Email/password присутствуют; PID не найден | Partner cards и disclosure в `/tours`; booking API не проверен | API booking → affiliate fallback; весь lifecycle у YouTravel | Обширные unit + E2E invariants | `active-unverified-flow` |
| YouTravel Affise | Клики/конверсии | affise client, snapshot cron | API key локально не найден | Не подтверждено | Не является каталогом или booking API | Snapshot tests | `dormant` |
| YouTravel webhook | Статус partner booking | `/api/webhooks/youtravel/booking` | Webhook secret локально не найден | Не подтверждено | Без webhook нельзя обещать актуальный статус в GoArgentina | Booking status tests | `prepared` |
| Sputnik8 | Экскурсии, affiliate-first | `src/lib/sputnik8`, sync, affiliate redirect | API key + username присутствуют | Не отделён от общего результата excursions | Основной UX — переход на Sputnik8; native order не обещать | Client/booking + redirect contracts | `configured-local` |
| Intui | Трансферы: native search | `src/lib/intui`, `/api/affiliate/transfers/*` | `INTUI_API_KEY` локально не найден | `/transfers` доступна; native result не проверен | Affiliate external partner | Search/mapper tests частично | `fallback-only` |
| Airalo | eSIM feed и affiliate handoff | `/esim`, `/api/affiliate/esim/book` | Локальный feed path присутствует | Страница и partner disclosure доступны | Покупка/активация у Airalo | Feed/route contracts частично | `active-unverified-flow` |
| WeGoTrip | Аудиогиды | `src/lib/wegottrip`, `/api/affiliate/audio-guides/book` | API key локально не найден | Страница и disclosure доступны | Catalog fallback + внешний checkout/app | Полный E2E не найден | `fallback-only` |
| LocalRent | Аренда автомобиля | `/car-rental`, partner widget/deep link | Partner ID локально не найден | Страница и disclosure доступны | Checkout, договор и отмена у LocalRent | Полный E2E не найден | `active-unverified-flow` |

## Платежи, коммуникации и platform services

| Интеграция | Назначение | Конфигурация/evidence | Граница ответственности | Статус |
|---|---|---|---|---|
| Stripe | Внутренняя онлайн-оплата, webhook, refund | Код и tests есть; secret локально отсутствует; production sandbox `false` | Только для offer с явно включённым provider; GoArgentina отвечает за reconciliation/refund | `dormant` до live checkout evidence |
| Mercado Pago | Внутренняя онлайн-оплата в ARS, webhook, refund | Код и tests есть; access token локально отсутствует | То же; refund требует отдельного enable flag | `dormant` до live checkout evidence |
| Manual/payment link | Согласованная оплата внутренних заявок | Модель и admin operations есть | Организатор/platform обязаны показать status и инструкции | `prepared`, offer-dependent |
| Resend/email delivery | Транзакционные письма/уведомления | Локальный API key присутствует; delivery loop production не проверен | Приложение отвечает за queue/retry/idempotency/fallback | `configured-local` |
| Supabase Auth | Identity, reset password, sessions | Production health/database OK; auth UI/routes есть | Supabase отправляет auth messages, приложение отвечает за redirect/copy/roles | `active-unverified-flow` |
| Supabase/Postgres | Primary persistence, RLS, CMS, bookings | Production health OK, migration `20260715003000_stage2_map_curation` | GoArgentina владеет schema, migrations, RLS, backups | `active-confirmed` |
| Search / Meilisearch | Primary search с DB/static fallback | Production search API работает; health count `500`; локальный host не найден | Приложение обязано контролировать freshness и fallback | `active-confirmed` с неизвестным фактическим backend source |
| Analytics/GTM/Метрика | Product analytics после consent | Последний readiness artifact показывал отсутствующие production IDs/snippets; новые consent changes требуют повторной проверки | Необязательные scripts только после consent | `dormant/unverified` |
| Wikimedia/media providers | Fallback media/provenance | Resolver и attribution code существуют | Нужны licence, source и deterministic fallback | `prepared/active by content` |

## Product truth по verticals

| Vertical | Кто продаёт/подтверждает | Где платёж | Где отмена/support | Что хранит GoArgentina |
|---|---|---|---|---|
| Собственный тур | GoArgentina + организатор | Manual/payment link/online только по capability | Организатор/platform по опубликованной политике | Полную внутреннюю заявку и её историю |
| Tripster | Tripster/гид | Tripster | Tripster | Offer snapshot, attribution, при API — reference/result |
| YouTravel | YouTravel/организатор партнёра | YouTravel | YouTravel | Offer snapshot, attribution, webhook status только при настроенной связи |
| Sputnik8 | Sputnik8/гид | Sputnik8 | Sputnik8 | Offer snapshot и attribution |
| Билеты/страховка/авто/eSIM/аудиогид/трансфер | Соответствующий партнёр | Партнёр | Партнёр | Search context без чувствительных данных, click/attribution |

## Operational contract для каждого adapter

Каждая активная интеграция должна иметь:

1. owner и ссылку на официальный contract;
2. production env readiness без вывода секретов;
3. timeout и классификацию retryable/non-retryable ошибок;
4. idempotency key для создания заказа/платежа;
5. `lastSuccessfulSyncAt`, freshness SLA и stale policy;
6. graceful degradation без ложного success;
7. source badge, external disclosure и owner cancellation;
8. outbound/booking/payment events с correlation ID;
9. contract test и production-safe smoke;
10. kill switch/feature flag и rollback.

## Release gates

### Можно оставлять публично

- Partner vertical с доступной страницей, корректным disclosure и рабочим fallback URL.
- Imported offer с source, freshness и безопасным поведением при недоступности detail API.
- Internal request только если результат сохраняется и доступен ответственному лицу.

### Скрыть или понизить

- Native booking, payment, refund или status sync без production credentials и smoke evidence.
- Партнёра без рабочего adapter/fallback или без disclosure.
- Виджет, который показывает форму, но не даёт проверяемого результата.
- Partner conversion dashboard без подтверждённого tracking source.

## Известные пробелы evidence

- Agent 2 не создавал реальные заказы и платежи в production.
- Production env сравнивался только по публичному поведению; локальные ключи не доказывают Vercel configuration.
- Не проверены partner dashboards, webhook delivery и фактическая атрибуция комиссии.
- Не выполнен login-based smoke писем, кабинетов и role switch.
- Перед release coordinator должен повторить `tripster:verify`, YouTravel/Sputnik sync checks и production-safe outbound tests в целевом deployment.
