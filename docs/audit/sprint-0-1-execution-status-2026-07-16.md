# Статус исполнения Sprint 0, 0A и 1

**Дата среза:** 16 июля 2026  
**Основная дорожная карта и готовые промпты:** [`full-project-readiness-roadmap-2026-07-15.md`](./full-project-readiness-roadmap-2026-07-15.md)  
**Ветка:** `codex/sprint-0-release-candidate`

## Executive summary

1. **Sprint 0 закрыт для зафиксированного release candidate** `ec5d30e6`: кандидат собран, прошёл локальные и preview-проверки и развёрнут в защищённый Vercel Preview. Production не продвигался.
2. После Sprint 0 началось новое объединённое рабочее дерево Sprint 0A–3. Оно **не является новым release candidate**, пока не зафиксировано отдельным SHA и не прошло единый gate после завершения всех параллельных изменений.
3. **Sprint 0A: фундамент готов, бизнес-приёмка не закрыта.** Production guard, реестр 25 journeys, Playwright Chromium/WebKit, evidence contract и workflow реализованы. Сейчас 0/25 journeys имеют L4: отдельного staging Supabase/Vercel, disposable mailbox, тестовых ролей и sandbox-контура нет.
4. **Sprint 1: критические дефекты приложения закрыты, инфраструктурная часть не закрыта.** Устранены опасные пути ролей, бронирований, партнёрских заявок, лидов, shop orders и staff API. Но staging rehearsal, migration history, explicit grants, live function privileges и durable rate limiting ещё требуют отдельного этапа.
5. Последняя интеграционная проверка: `audit:quick` — 212 файлов / 1106 тестов; в последующем полном gate до production build — 213 файлов / 1108 тестов, 13/13 smoke journeys. После исправления интеграционного дефекта отдельная production-группа gate прошла build и isolation. Live production SEO baseline остаётся красным: 903 критические находки.

## Sprint 0 — фактическое закрытие

### Зафиксированный кандидат

| Доказательство | Результат |
|---|---|
| Release candidate SHA | `ec5d30e6f533dbd3b620f673541664acfef7526d` |
| Состав | commits `f983d839`, `ae5b4a69`, `ec5d30e6` |
| Vercel Preview | deployment `dpl_FwA5VmQy1c9pbU1HgVmKR2m7YpD8`, статус READY, SSO protected |
| Cloud build | 1058/1058 tests |
| Stage 2 visual | 42/42 |
| Локальный UX audit | 323 pass, 1 ожидаемый skip |
| Локальный SEO candidate | 603/603 |
| Production promotion | не выполнялся |

### Исправление доказательств после закрытия

Локальный release report ошибочно мог брать устаревший `GIT_SHA` из `.env.local`. Добавлен единый fingerprint с приоритетом Vercel/GitHub/CI и безопасным fallback на фактический `git HEAD`, а также:

- dirty-tree entry count и hash;
- SHA lockfile;
- count/latest/hash миграций;
- единое использование fingerprint в release gate, RLS audit, production readiness и build info;
- unit tests для приоритетов SHA.

Это не меняет факт закрытия кандидата `ec5d30e6`, но делает последующие доказательства воспроизводимыми и не позволяет ошибочно приписать отчёт другому SHA.

## Sprint 0A — статус acceptance foundation

### Реализовано

- жёсткий отказ при production URL/domain/Supabase ref;
- отдельные переменные только для staging acceptance без fallback на production;
- проверка согласованности application URL, DB URL, JWT ref и deployment ref;
- обязательные disposable mailbox, payment sandbox и запрет partner writes;
- безопасный environment fingerprint без секретов;
- ровно 25 journeys `J01`–`J25`;
- Chromium + WebKit;
- обязательные evidence attachments: `browser`, `request`, `database`, `roleVisibility`, `cleanup`;
- итог `failed`, если отсутствует браузер или слой evidence;
- честный `not_implemented` вместо скрытого skip/pass;
- ручной GitHub workflow и защищённый `/api/acceptance/environment`;
- документация запуска в [`docs/testing/staging-acceptance.md`](../testing/staging-acceptance.md).

### Текущий сценарный результат

| Группа | Journeys | L4 | Статус |
|---|---|---:|---|
| Гость и каталог | J01–J03 | 0/3 | Контракты и smoke есть; staging evidence отсутствует |
| Auth и турист | J04–J08 | 0/5 | Ролевые дефекты закрыты; нет mailbox/session/DB cleanup journey |
| Организатор и модерация | J09–J15 | 0/7 | Архитектура и security contracts есть; нет двух-/трёхролевого staging run |
| Availability, booking и CRM | J16–J21 | 0/6 | Atomic/idempotency contracts есть; нет конкурентной staging записи |
| Payment, admin, privacy, ops | J22–J25 | 0/4 | Unit/security contracts есть; нет provider sandbox/restore/durable ops evidence |
| **Итого** | **J01–J25** | **0/25** | **Sprint 0A не закрыт** |

Полная построчная матрица фактических уровней L0–L3 находится в разделе 3.16 основной дорожной карты. Ни один текущий source/unit/smoke тест не повышает journey до L4 без UI → API → staging DB/RLS → role visibility → cleanup.

### Блокер и владелец следующего действия

Нужен отдельный persistent staging:

1. Supabase branch/project без production data и с отдельными Auth/Storage/API credentials.
2. Vercel staging/preview, собранный именно с этим Supabase ref.
3. Disposable mailbox и тестовые tourist/applicant/organizer/limited-admin/full-admin роли.
4. Payment/provider sandbox и запрет реальных partner orders.
5. Разрешение применить миграции только к staging после нормализации их истории.

До этого write journeys на текущем `.env.local` запрещены: он указывает на production Supabase `uooxrypocahomoqzdvzy`.

## Sprint 1 — выполненный security hardening

### Закрытые P0/P1 пути

- регистрация всегда создаёт только туриста; organizer role выдаётся через заявку/одобрение;
- общий booking access больше не доверяет одному `admin` role; sandbox payment требует staff capability `operations.bookings`;
- partner excursion booking ограничен rate limit, стабильным UUID idempotency key, durable claim/replay/conflict и отключён по умолчанию для Tripster contact form;
- `body.userId` больше не используется как доверенный actor;
- Travelpayouts proxy выключен по умолчанию и принимает только точный HTTPS allowlist партнёров;
- newsletter/contact insert переведён на server API + service role;
- shop order создаётся только через idempotent server API, с replay/conflict и rate limit;
- expert edits/moderation/inquiry status и staff removal пишут admin audit;
- staff mutations разрешены только активному подтверждённому owner `super_admin` с явным `*`; service-role, self-mutation, overwrite и изменение подтверждённого owner запрещены;
- runtime allowlists для presets/capabilities и проверка согласованности wildcard;
- migration template дополнен explicit grants, RLS/policies, owner/update/select, function/search_path и type sync.

### API-инвентаризация

| Показатель | Количество |
|---|---:|
| Route files / handlers | 238 / 309 |
| Mutation handlers | 128 |
| Admin capability/session | 69 + 1 |
| Organizer protected | 24 |
| Cron | 19 |
| Signed webhook / API key / capability token | 3 / 3 / 4 |
| Auth/optional + auth-flow | 49 + 7 |
| Public | 59 |
| С rate limit / idempotency / audit | 27 / 6 / 38 |

### Live read-only Supabase findings

- 86/86 public tables имеют RLS; 176 live policies; P0 RLS leak не найден.
- В репозитории теперь 69 migration files; исторически обнаружены повторяющиеся timestamp `20250622000000` и `20250623000000`.
- `supabase_migrations.schema_migrations` в проверяемой production DB недоступна; безопасно определить применённый набор по истории нельзя.
- Явные grants найдены только у малой части таблиц; новый Supabase project/staging может не воспроизвести старое неявное поведение Data API.
- Live schema содержит RLS helper/event trigger, отсутствующий в migrations: есть schema drift.
- Найдены 9 `SECURITY DEFINER`, legacy `auth.role()` expressions, advisor warnings по initplan/permissive policies/mutable search path и missing FK indexes. Исправлять их массово без staging rehearsal нельзя.

### Почему Sprint 1 ещё не закрыт

Exit criteria требуют зелёного `supabase:verify`, advisors и реального RLS/grants/function audit на staging. Две новые security migrations созданы, но не применялись ни к staging, ни к production. Не завершены:

1. каноническая migration history без повторного исполнения старого SQL;
2. уникальные migration IDs и воспроизводимый clean replay;
3. explicit grants для всех 86 таблиц по фактической роли каждой сущности;
4. ревизия PUBLIC EXECUTE/search_path/legacy policies;
5. подтверждённые FK/RLS performance indexes;
6. durable distributed limiter на всех чувствительных public mutations;
7. report-only → enforce CSP rollout.

## Проверки текущего объединённого дерева

| Проверка | Результат |
|---|---|
| `audit:quick` | pass: TypeScript, ESLint без новых blocking errors, 212 files / 1106 tests |
| Повторные unit/contracts внутри full gate | pass: 213 files / 1108 tests |
| Static RLS | pass: 86 tables, 0 critical |
| Production readiness в безопасном локальном режиме | 11 OK, 6 warnings, 0 fail, 12 skip |
| Commerce integrity | pass: 5 files / 16 tests |
| Playwright critical smoke | pass: 13/13 |
| Production build + isolation после интеграционного фикса | pass |
| Live production SEO baseline | fail: 903 critical + 2074 warnings; это отдельный Sprint 4 debt |

Во время параллельной Sprint 2/3 работы production build поймал отсутствующий `next/image` import и слишком узкий `images.localPatterns`. Импорт возвращён, `/media/**` разрешён, повторная production-группа прошла. Полный единый gate необходимо повторить после заморозки всего параллельного diff и перед следующим commit/deploy.

## Последовательность следующих спринтов

| Очередь | Спринт | Условие безопасного старта / выхода |
|---:|---|---|
| 1 | Завершить 0A | отдельный staging, 25/25 L4, 0 failed/skip/orphans |
| 2 | Завершить 1 | migration/grants/function rehearsal на staging, security gates green |
| 3 | Sprint 2 | Sentry release proof, durable cron/outbox, SLO, backup restore RPO/RTO |
| 4 | Sprint 3 | cold mobile performance budgets и CI enforcement на стабильном SHA |
| 5 | Sprint 4 | 0 critical sitemap crawl, canonical/locale truth |
| 6 | Sprint 5 | consent-safe funnel analytics и verified dashboards |
| 7 | Sprint 6 | единая native/partner booking truth и L4 funnel |
| 8 | Sprint 7 | organizer create → moderate → publish → CRM L4 |
| 9 | Sprint 8 | CMS/editorial factory с provenance и publication QA |
| 10 | Sprint 9 | sandbox payment, webhook, refund, compliance L4 |
| 11 | Sprint 10 | WCAG/cross-browser/system UI gate |
| 12 | Sprint 11 | API contracts, architectural debt, platform upgrade |
| 13 | Sprint 12 | i18n/search/growth только после core readiness и 4 недель analytics |

Scope, exit criteria и готовый копируемый prompt для каждого Sprint 0–12 находятся в разделе 6 основной дорожной карты. Агенты могут делегировать bounded read-only/implementation subtasks, но один lead должен владеть migrations, shared fixtures, release evidence и финальной интеграцией.

## Решение на ближайший цикл

1. Не применять новые migrations и не запускать write acceptance на production.
2. Создать isolated staging и сначала доказать clean migration/grants replay.
3. Реализовывать J01–J25 вертикальными пакетами: auth → organizer/moderation → booking/CRM → payment/privacy/ops.
4. После заморозки параллельных Sprint 2/3 изменений повторить полный `release:gate`, staging acceptance и только затем формировать новый commit/deploy candidate.
5. Production promotion разрешать отдельно после review отчётов, ручных секретов и rollback readiness.
