# Capability matrix: фактические возможности продукта

## Повторный срез 2026-07-15

Единый resolver реализован в `src/lib/product-capabilities.ts` с контрактами `experienceType`, `bookingMode`, `paymentMode`, `availabilityMode`, `dataSource`, `contentOwner` и `dataFreshness`. Tripster `is_bookable=false` даёт disabled CTA. Live verify показал: Tripster External Orders = 403, YouTravel create endpoints = 405; до изменения прав провайдера реальная capability этих предложений — `external_redirect`, а не внутренний заказ. Внешний fallback является корректным product truth.

Дата проверки: 2026-07-15
Кодовая база: `8ddef6615adb79069c444738e83a4b24bfefcef8`
Production-срез: `https://www.goargentina.ru`, `/api/health` сообщил тот же SHA.

## Как читать матрицу

- `Да` — сценарий найден в интерфейсе и подтверждён соответствующей реализацией.
- `Частично` — работает только часть пути, есть fallback или результат зависит от партнёра.
- `Условно` — код существует, но функция включается конфигурацией конкретного предложения или окружения.
- `Нет` — сценарий не реализован или сознательно не обещается.
- `Не подтверждено` — Agent 2 не получил production-evidence; это нельзя трактовать как `Да`.
- `N/A` — столбец неприменим.

Локальное наличие ключей не является доказательством production-настройки. Для публикации обещания требуются одновременно: рабочий UI, backend-эффект, сохранённый результат, корректные права, наблюдаемость, тест и production-проверка.

## Нормализованная модель предложения

Каждое коммерческое предложение должно разрешаться в один объект возможностей до построения CTA и текста:

```yaml
bookingMode: internal_request | internal_checkout | external_partner | lead_to_manager | information_only | coming_soon
paymentMode: none | manual | payment_link | online_checkout
messagingMode: none | email | internal_chat
source: goargentina | tripster | youtravel | sputnik8 | other
availabilityMode: static | partner | internal_live
cancellationOwner: platform | organizer | partner
```

Текущие типы `bookingMode: scheduled | on_request | both`, `partnerSource` и `customBookingLink` остаются источниками данных, но публичному слою нужен единый resolver в модель выше. До его появления copy нельзя выводить из типа страницы или общего маркетингового текста.

## Коммерческие предложения

| Функция / предложение | UI видим | Backend | Сохранение | Уведомления | Права | Тесты | Production | Legal/copy | Итоговая capability |
|---|---|---|---|---|---|---|---|---|---|
| Собственный тур: заявка | Да | Да | `bookings` | Да, email/inbox при настроенной доставке | Гость или турист; организатор видит свои заявки | Unit + E2E lookup | Условно: публичный API собственных туров вернул `0` | Частично: общие тексты нельзя применять к партнёрам | `internal_request`, `manual`, `email/internal_chat`, `goargentina`, `internal_live`, `organizer` |
| Собственный тур: внутренний checkout | Условно для опубликованного тура | Да | `bookings`, travellers, price snapshot | Да | Проверки на сервере | Unit/integrity | Не подтверждено на живом собственном offer | Не должен подаваться как общий сценарий | `internal_checkout`, payment определяется offer |
| Собственный тур: онлайн-оплата | Условно | Stripe/Mercado Pago и webhooks в коде | payment links/transactions | Частично | Admin + tokenized traveler flow | Unit/integrity | Не подтверждено; sandbox production = `false`, локальных provider keys нет | Нельзя обещать до live-проверки провайдера и refund | `internal_checkout`, `online_checkout` только при активном provider |
| Собственный тур: ручная оплата/ссылка | Условно | Да | booking/payment metadata | Частично | Организатор/admin | Unit | Не подтверждено на offer | Допустим только точный текст «после подтверждения» | `internal_request`, `manual` или `payment_link` |
| Tripster: экскурсия | Да | Каталог, расписание, цена; External Orders + fallback | Партнёрский заказ; локально attribution/event | У партнёра; External Orders имеет ограничения | Публичный просмотр, server-only credentials | Unit + partner E2E invariants | Каталог production отвечает; создание заказа не проверено Agent 2 | Disclosure есть; не обещать внутренний чат/оплату | `external_partner`, `online_checkout`, `none`, `tripster`, `partner`, `partner` |
| Tripster: многодневный тур | Да, если импортирован | Live enrichment + fallback | Партнёрский результат | У партнёра | Публичный просмотр | Unit pipeline | Условно; зависит от опубликованных данных | Требуется единый badge/CTA с listing до detail | `external_partner`, `online_checkout`, `none`, `tripster`, `partner`, `partner` |
| YouTravel: тур | Да; production-каталог содержит партнёрские карточки | Booking API с affiliate fallback, offers, webhook | Партнёрский booking result/status при доступе API | У партнёра; webhook подготовлен | Server-only credentials | Unit + E2E | Listing подтверждён; native booking не проверен | Production-текст сообщает оплату и бронирование на YouTravel.me | `external_partner`, `online_checkout`, `none`, `youtravel`, `partner`, `partner` |
| Sputnik8: экскурсия | Да, если импортирована | Каталог; native order подготовлен | Основной UX не хранит внутренний заказ | У партнёра | Server-only credentials | Unit для client/redirect | Каталог не проверен отдельно от общего `/api/excursions` | Основной flow должен называться переходом к Sputnik8 | `external_partner`, `online_checkout`, `none`, `sputnik8`, `partner`, `partner` |
| Авиабилеты / Aviasales | Да | Travelpayouts whitelabel/deep link | Только attribution/event | У партнёра | Публично | Widget lifecycle tests | Страница доступна; production widget результат не проверен | Disclosure явно говорит, что сайт не продаёт билеты | `external_partner`, `online_checkout`, `none`, `other`, `partner`, `partner` |
| Страхование | Да | Travelpayouts whitelabel | Только attribution/event | У партнёра | Публично | Общие affiliate contracts | Страница доступна; расчёт не проверен | Disclosure корректный | `external_partner`, `online_checkout`, `none`, `other`, `partner`, `partner` |
| Аренда авто / LocalRent | Да | Partner widget/deep link | Только attribution/event | У партнёра | Публично | Не найден отдельный E2E | Страница и disclosure доступны | Корректно сообщает внешнюю продажу | `external_partner`, `online_checkout`, `none`, `other`, `partner`, `partner` |
| Трансферы / Intui | Да | Native search при `INTUI_API_KEY`, иначе affiliate fallback | Lead/outbound event; не внутренний заказ | У партнёра | Публично | Mapper/search tests частично | Страница доступна; локально Intui key отсутствует | Нужен явный disclosure и при fallback | `external_partner`, `online_checkout`, `none`, `other`, `partner`, `partner` |
| eSIM / Airalo | Да | XML feed + affiliate booking route | Outbound attribution | У партнёра | Публично | Parser/route contracts частично | Страница доступна; локальный feed присутствует | Корректно сообщает покупку у партнёра | `external_partner`, `online_checkout`, `none`, `other`, `partner`, `partner` |
| Аудиогиды / WeGoTrip | Да | Catalog/fallback + affiliate route | Outbound attribution | У партнёра | Публично | Нет полного E2E в найденной выборке | Страница доступна | Корректно сообщает внешний checkout и приложение | `external_partner`, `online_checkout`, `none`, `other`, `partner`, `partner` |
| Магазин цифровых гидов | Да | Shop API/order routes | `shop_orders` | Email при настроенной доставке | Гость/пользователь, admin | Частично | Страница доступна; end-to-end покупка не проверена | CTA должен отражать фактический manual/payment flow товара | `lead_to_manager` или `internal_checkout` только по capability товара |
| Эксперт / консультация | Да | Lead/contact route | Lead | Email | Публичная форма, admin CRM | Частично | Не проверено end-to-end | Не называть бронированием без слота и сохранённой записи | `lead_to_manager`, `manual`, `email`, `goargentina`, `static`, `platform` |

## Пользовательские и редакционные функции

| Функция | UI видим | Backend | Сохранение | Уведомления | Права | Тесты | Production | Product truth |
|---|---|---|---|---|---|---|---|---|
| Регистрация, вход, reset/update password | Да | Supabase Auth + server routes | Auth/profile | Email через auth provider | Пользователь | Auth tests существуют | Маршруты доступны; полный почтовый цикл вне этого аудита | Нельзя раскрывать существование аккаунта |
| Избранное | Да | API + local fallback | `favorites` / local | N/A | Пользователь или локальная сессия | Store tests | Не проверено с production-account | Не обещать синхронизацию между устройствами без входа |
| Личный кабинет заявок | Да | Bookings API | `bookings` | Inbox/email | Владелец по user/token | Security + E2E lookup | Маршруты защищены | Показывает только внутренние заявки; партнёрские покупки остаются у партнёра |
| Внутренние сообщения | Да для подходящих внутренних сущностей | Conversations/messages API | conversations/messages | Inbox/email | Участники диалога | Частично | Не проверено live-account | Нельзя показывать для внешнего offer |
| Отзывы | Да | Eligibility + reviews API | reviews | Moderation path | Только допустимый пользователь | Unit | Не проверено live-account | Для партнёрских туров eligibility отличается |
| Подбор поездки | Да | Recommendation/podbor API | Результат/lead по сценарию | Частично | Публично | Частично | Страница SSR доступна | Это подбор, не гарантия наличия и не бронирование |
| Карта | Да | Map objects API + curated data | `map_objects`/content | N/A | Публично; admin edit | Unit/E2E visual | Production доступна | Источник и тип объекта должны быть человекочитаемыми |
| Глобальный поиск | Да | Meilisearch → Postgres → static fallback | Индекс/контент | N/A | Публично | Query tests | Production API работает, индекс `500` | Источник fallback не должен менять обещание результата |
| Кабинет организатора | Да | Organizer APIs | tours, bookings, settings, articles | Inbox/email | Organizer/server guards | Unit + route tests | Маршруты существуют; account flow не проверен | Финансы и выплаты не равны активной платёжной системе |
| Статьи организатора | Да | Draft/autosave/preview/moderation | content documents + moderation queue | Moderation/email | Organizer/admin | Workflow tests | Production DB migration присутствует; role flow не проверен | Публикация только после модерации |
| CMS контента | Да | Admin content APIs | CMS documents + Supabase | N/A | Granular admin capabilities | Contracts | Blog/guide/destination cutover 100%; places 28% | Place fallback остаётся частью production truth |
| Управление публичной навигацией | Да в admin settings | `site.navigation` global | `site_settings` + 60s cache | N/A | Settings capability | Normalize/nav tests | Код на production SHA; фактическое сохранение не проверено Agent 2 | Управляет видимостью разделов и 3 utility links, не всей структурой mega-menu/footer |

## Обязательные правила UI

1. CTA формируется только после разрешения capability конкретного offer.
2. `Забронировать на GoArgentina` допустимо только при сохранённой внутренней заявке/заказе.
3. Для партнёра до клика показываются источник, внешний характер действия и владелец оплаты/отмены.
4. Отсутствие production-конфигурации переводит сценарий в честный fallback, а не в ложный success.
5. Партнёрская покупка не должна появляться в разделе внутренних заявок как будто GoArgentina управляет её статусом.
6. Онлайн-оплата включается только на уровне offer и provider readiness, не глобальным маркетинговым обещанием.

## Главные разрывы на 2026-07-15

1. Resolver покрывает туры и партнёрские CTA; остальные verticals всё ещё используют локальные адаптеры и должны мигрировать постепенно.
2. Собственные туры технически поддерживаются, но production `/api/tours` вернул пустой массив; marketplace сейчас в основном партнёрский.
3. Платёжная архитектура есть, но active production checkout/refund не подтверждены.
4. Внешние покупки не дают GoArgentina достоверного полного lifecycle без webhook/status API конкретного партнёра.
5. CMS-навигация управляет видимостью верхних разделов, но не всеми колонками mega-menu, footer и локализованными вариантами.
