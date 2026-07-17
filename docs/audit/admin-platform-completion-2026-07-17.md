# Админ-платформа и туристические модули — итог и следующие спринты

Дата: 17 июля 2026 года  
Ветка кандидата: `codex/readiness-90-program`  
Связанные документы: `admin-modular-settings-2026-07-17.md`,
`travel-modules-admin-2026-07-17.md`, `full-project-readiness-roadmap-2026-07-15.md`.

## Итог

Для текущего продуктового контура создана единая owner-first админка: владелец без знания кода
может управлять внешним видом, разделами сайта, контентом, пользователями, сотрудниками, тарифами,
турами, заявками, оплатами, магазином, коммуникациями, интеграциями и состоянием выпуска.

Система не строится как набор независимых переключателей. Общие механизмы повторно используются
во всех вертикалях:

- роли и capabilities — для администратора, поддержки, редактора, модератора и финансов;
- CAS-версии и атомарные RPC — для конкурентных изменений;
- единый журнал действий и PII-free durable outbox — для операций и уведомлений;
- module policy и commercial entitlements — для модулей, рынков, провайдеров и лимитов;
- provider registry и capability mode — для собственных продуктов и партнёрских переходов;
- единые настройки бренда, навигации, CAPTCHA, email и публичной доступности;
- единый CMS workflow — для страниц, статей, базы знаний, версий и расписания публикации;
- строгая readiness-модель — ошибка или пропущенная проверка не превращается в зелёный статус.

## Что готово в коде

| Направление | Реализованный owner-сценарий | Граница готовности |
|---|---|---|
| Настройки сайта | пакетное сохранение с версией, подтверждение рискованных изменений, last-known-good, быстрый публичный snapshot | готово в коде |
| Дизайн | палитры, шрифты, шапка, футер, глобальные элементы, живой просмотр | готово в коде |
| Модули и страницы | блог, магазин, форум, база знаний, регионы, места, карта, туры, экскурсии, апартаменты, авто и трансферы | отключение закрывает меню, URL, sitemap, поиск и поддержанные mutation API |
| Пользователи | полный серверный поиск, пагинация, роли турист/организатор, блокировка, заметки, CAS | staff-аккаунты управляются отдельно |
| Команда | пресеты и точечные права, защита владельца, атомарное назначение | готово в коде |
| Тарифы | планы, подписки, модули, рынки, провайдеры и общий лимит активных предложений | production требует применённых миграций |
| Туры и экскурсии | черновик → отправка → модерация → публикация → снятие/архив, CAS и пагинация | партнёрские продукты остаются отдельными capability |
| Модерация | туры, отзывы, жалобы, форум и авторские статьи в одной транзакции | готово в коде |
| Бронирования | допустимые переходы, места, paid/waiting_payment truth, audit/outbox | реальная оплата требует sandbox/live провайдера |
| Магазин | каталог, категории, заказы, trusted payment status, выдача и отмена после возврата | готово в коде |
| CMS и база знаний | версии, CAS, публикация, расписание, restore, атомарный импорт, поиск | готово в коде |
| Email | шаблоны, бренд, категории, очередь, повторная отправка с подтверждением | доставка требует настроенный почтовый сервис |
| Апартаменты | multi-market inventory, модерация, календарь, заявка, операционный inbox, подтверждённая блокировка дат | режим `request`, без ложной мгновенной оплаты |
| Авто и трансферы | multi-market provider registry, парк, документы, предложения, заявки, распределение транспорта, inbox | native request; LocalRent/Intui — честные affiliate adapters |
| Финансы | ledger, refund approval, payout batches, export/complete/cancel с подтверждениями | реальные деньги только после sandbox acceptance |
| Аналитика | controlled server ingestion, PII-free события, truthful KPI/cohorts, unavailable ≠ 0 | production KPI требуют живых данных |
| Готовность выпуска | backup/restore truth, environment/evidence provenance, owner-first статусы | staging и внешние кабинеты остаются обязательными |

Отели намеренно не реализованы: по решению владельца это только planned-модуль до отдельной
коммерческой и операционной модели.

## Проверенные сквозные сценарии

| Сценарий | Проверено | Результат |
|---|---|---|
| Первичная настройка владельца | реальные значения бренда, модулей и команды; пустые строки не дают ложный зелёный статус | PASS |
| Отключение публичного модуля | навигация, прямой URL, sitemap, поиск и запись закрываются fail-closed | PASS |
| Изменение ролей | personal session, защищённые staff/owner цели, одобренная заявка организатора, CAS | PASS |
| Создание и публикация тура | entitlement, market, общий лимит, atomic submit, moderation queue, audit | PASS |
| Два параллельных publish | единый advisory lock между турами, апартаментами, авто и трансферами | PASS |
| Решение модератора | entity + queue + audit + outbox в одной транзакции; stale экран получает conflict | PASS |
| Бронирование тура | повтор запроса идемпотентен, отмена освобождает места, оплата не маскируется | PASS |
| Заказ магазина | ручная подмена оплаты запрещена, paid cancel требует refund | PASS |
| Импорт базы знаний | весь пакет или ничего, повтор операции безопасен, версия сохраняется | PASS |
| Заявка на апартаменты | CAPTCHA, idempotency, приватный адрес/PII, подтверждение блокирует даты | PASS |
| Заявка на авто/трансфер | provider/market/currency/timezone, CAPTCHA, allocation conflict, audit | PASS |
| CSV-выгрузка | все страницы, защита от формул, явный предел, private/no-store | PASS |
| Достоверность аналитики | только controlled events; ошибка источника возвращает unavailable, а не ноль | PASS |
| Готовность к релизу | warn/skip/stale не дают ready; restore evidence обязателен | PASS |

Технические доказательства на frozen candidate:

- PostgreSQL 17 clean replay: 94/94 миграции;
- SQL lifecycle smoke: 12/12 файлов;
- TypeScript: PASS;
- ESLint: 0 errors;
- Vitest: 349/349 файлов, 1657/1657 тестов;
- media/runtime Wave 1: 15/15 targeted tests, public client leaks 69 → 60;
- production build и единый release gate: PASS на candidate tree
  `150dccbd3a8b1b1b0092b7fde10098ba4b0337de`.

## Почему нельзя честно назвать production deployment завершённым

Кодовый контур готов к единому release gate, но production Supabase имеет неканонизированную
историю схемы, а отдельной staging-среды нет. Применять новый набор миграций прямо к живым данным
или разворачивать приложение, которое от них зависит, небезопасно. Это внешний operational blocker,
а не скрытая недоработка интерфейса.

Для снятия блокировки нужны: staging Supabase/Vercel, backup, clean migration rehearsal,
authenticated acceptance, проверка реальных почтовых/платёжных/партнёрских каналов и только затем
production rollout по runbook.

## Следующая последовательность спринтов

### Sprint R0 — staging и безопасный выпуск

Цель: создать среду, доказать миграционный путь и выпустить текущий кандидат без риска живым данным.

Exit criteria:

- отдельные staging Supabase и Vercel;
- backup production и документированное восстановление;
- 94 миграции применяются с нуля и поверх production-like snapshot;
- 12 SQL smoke, 1657 unit tests и critical Playwright проходят на staging;
- deploy, rollback и 60-минутное наблюдение подтверждены evidence одного tree.

Копируемый промпт:

```text
Выполни Sprint R0 для проекта «Пора в Аргентину». Цель — безопасный staging и выпуск frozen
candidate, не расширение продукта. Прочитай AGENTS.md, docs/DEPLOY.md,
docs/release-2026-07/rollback-plan.md, docs/audit/admin-platform-completion-2026-07-17.md и все
staging-acceptance contracts. Можешь создать подагентов для независимых read-only проверок, но один
агент должен владеть migration/deploy lock. Никогда не применяй миграции к production до backup,
restore rehearsal и PASS на отдельном staging. Зафиксируй exact git tree, environment identity и
provenance каждого evidence. Прогони clean replay, production-like replay, authenticated journeys,
audit, build, SEO crawl и rollback drill. Exit: все критерии Sprint R0 доказаны; при внешнем блокере
остановись до production mutation и верни точный handoff владельцу.
```

### Sprint R1 — production acceptance, SEO и метрики

Цель: после выпуска подтвердить, что реальный сайт, поисковые системы и аналитика видят новый кандидат.

Exit criteria:

- production smoke туриста, организатора и администратора;
- sitemap/canonical/hreflang crawl без critical;
- GSC/Bing submit и сохранённые ответы;
- consent-safe события видны в GTM/GA4/Метрике без PII;
- booking/native/partner outcomes различаются в воронке;
- live evidence связано с deployment SHA и временем проверки.

Копируемый промпт:

```text
Выполни Sprint R1 только после PASS Sprint R0 и успешного production deployment. Раздели подагентов
на public SEO crawl, consent/analytics и authenticated journeys; они работают read-only и не меняют
production. Сначала зафиксируй deployment SHA, base URL и Supabase project ref. Проверь sitemap,
canonical, hreflang, robots, structured data, GSC/Bing, GTM/GA4/Яндекс Метрику и все booking outcomes.
Не записывай PII в аналитику и не выдавай отсутствие данных за ноль. Верни единый evidence report,
список реальных отклонений и rollback recommendation, если найден P0.
```

### Sprint M2R — пилот собственных авто и трансферов

Цель: включить уже готовый native request-контур для ограниченной группы проверенных организаторов.

Exit criteria:

- provider/market readiness включается точечно feature flag;
- документы проверены и доступны только по коротким signed URL;
- два запроса не могут получить один транспорт на пересекающееся время;
- LocalRent/Intui продолжают работать независимо как affiliate handoff;
- цена, залог, страховка, багаж, встреча и способ подтверждения показаны до заявки;
- operations SLA, отмена, перенос и support owner проверены на staging.

Копируемый промпт:

```text
Выполни Sprint M2R как ограниченный staging/pilot rollout существующего mobility foundation. Прочитай
provider registry, capability contract, migration 20260717041000 и admin/organizer mobility UI.
Можешь создать подагентов для rental, transfer и security scenarios, но не создавай отдельные union
ветки под LocalRent/Intui. Новый поставщик должен добавляться registry entry без source-switch в общем
UI/API. Сохраняй marketId/countryCode, timezone, currency snapshot, source ownership, capability mode,
publication/moderation и provider health. Не имитируй live availability партнёров. Прогони allocation
conflicts, documents, CAPTCHA/idempotency, cancellation/reschedule и analytics without PII.
```

### Sprint M3R — пилот собственных апартаментов

Цель: запустить несколько реальных объектов в режиме заявки с ручным подтверждением.

Exit criteria:

- адрес и PII владельца не раскрываются публично;
- published объект прошёл модерацию и media-rights;
- confirmed inquiry атомарно блокирует даты, cancel освобождает блок;
- timezone/currency/market snapshots сохраняются;
- организатор и администратор видят одну достоверную очередь;
- письма и SLA поддержки подтверждены на staging.

Копируемый промпт:

```text
Выполни Sprint M3R как staging/pilot rollout native apartments. Прочитай migrations 40000/44000,
apartment repository, inquiry inbox и module policy. Подагенты могут отдельно проверять public privacy,
calendar concurrency и operations/email, но не должны менять общую схему параллельно. Сохраняй
marketId/countryCode, property timezone, source/display currency snapshot, source ownership, booking
mode и status draft/review/published/archived. Не превращай request в мгновенную бронь и не подключай
Booking.com/Yandex как один booking_link. Exit: реальные staging-объекты проходят весь сценарий без
overbooking, PII leak и ложного подтверждения.
```

### Sprint M4 — единая коммерческая платформа

Цель: повторно использовать один коммерческий слой для туров, апартаментов, авто и трансферов.

Exit criteria:

- capability contract объявляет request/booking/payment/refund/payout по типу продукта;
- единые комиссии, налоги, валютный snapshot, депозит, отмена и документы;
- payment webhooks проверяют подпись и идемпотентны;
- payout/refund доступны только соответствующим ролям;
- reconciliation и outbox восстанавливаются после частичного внешнего сбоя;
- UI не показывает действие без серверной capability.

Копируемый промпт:

```text
Спроектируй и реализуй Sprint M4 без копирования логики между вертикалями. Начни с ADR и inventory
существующих booking/payment/refund/payout contracts. Используй один generic commercial capability
resolver, один money/currency snapshot contract и атомарные ledger/outbox операции. Создай подагентов
для schema/ledger, provider adapters и UI capability review; только один агент владеет миграцией.
Не меняй production и не подключай реальных провайдеров без sandbox. Обязательны signature,
idempotency, concurrency, refund-before-cancel, payout segregation, reconciliation и PII-free events.
```

### Sprint P1 — media boundary Wave 2/3 и публичная производительность

Цель: убрать оставшиеся цепочки полного медиаманифеста из публичных client graphs.

Exit criteria:

- 0 public `use client` chains к full manifest/resolver/local fallback/feed query;
- compact generated slot map менее 50 KB;
- content routes ≤350 KB, tour/excursion detail ≤450 KB по установленному бюджету;
- нет `Serializing big strings`;
- image rights/integrity и responsive sizes остаются зелёными.

Копируемый промпт:

```text
Выполни Sprint P1 по трём изолированным волнам: compact public slot map, provider/repository split и
server-only seal. Прочитай media boundary tests и текущий AST audit. Подагенты могут брать только
непересекающиеся leaf graphs; один интегратор проверяет общий bundle. Не переписывай изображения и не
ломай rights manifest. После каждой волны измеряй число leaking client entries/routes и route budgets.
Exit только при 0 публичных client chains к full manifest и зелёных build/smoke/media checks.
```

### Sprint H0 — discovery отелей, без разработки checkout

Цель: принять отдельное продуктовое решение до начала реализации отелей.

Exit criteria:

- выбрана модель inventory/provider и ответственность за availability/rates;
- определены договоры, налоги, отмены, овербукинг и поддержка;
- partner handoff отделён от native booking;
- подготовлены data model, capability matrix, ADR и оценка стоимости;
- публичный planned-модуль не обещает готовый продукт.

Копируемый промпт:

```text
Проведи только discovery Sprint H0 для модуля отелей. Не создавай таблицы, checkout, фиктивные цены
или availability. Исследуй native inventory против provider/affiliate моделей, договорную схему,
налоги, отмены, overbooking, support и multi-country requirements. Создай подагентов для product,
legal/operations и architecture, затем сведи ADR, capability matrix, риски, стоимость и go/no-go.
Сохрани planned-модуль выключенным до отдельного решения владельца.
```

## Правило для всех следующих агентов

Каждый спринт начинается с immutable tree и списка владельцев файлов. Общую миграцию, build или deploy
в один момент выполняет только один агент. Любой зелёный отчёт обязан содержать tree, среду, URL,
время и срок свежести; иначе он считается недействительным. Внешняя недоступность, warn, skip или
отсутствие реальных данных никогда не заменяются успешным статусом.
