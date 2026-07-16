# Полная готовность проекта и профессиональная дорожная карта

Дата среза: **15 июля 2026**
Проект: **«Пора в Аргентину»**
Production: `https://www.goargentina.ru`
Проверяемый локальный кандидат: текущее рабочее дерево на ветке `main`

## 1. Итоговый вердикт

Проект уже является крупным работающим продуктом, а не прототипом: есть публичный туристический портал, партнёрский каталог, собственные туры и экскурсии, кабинеты туриста и организатора, админка, CMS, бронирования, платёжный контур, уведомления, карты и база знаний.

**Опубликованный сайт работает, но текущее рабочее дерево нельзя выкладывать напрямую в production.** Кандидат готов к контролируемой staging-приёмке после короткого стабилизационного спринта, однако пока остаётся `NO-GO` для прямого deploy.

Главные причины:

1. После полного сценарного прогона в рабочем дереве **483 изменённых или новых файла**: 405 отслеживаемых и 78 новых. В число изменений вошёл автоматически обновлённый UX backlog. Это слишком большой незакреплённый релизный пакет.
2. Production отдаёт commit `543ead8ac198d8e45e73b840221a460fb43cdb7b`; локальный кандидат заметно опережает его.
3. Read-only проверка живой БД подтвердила новую native-product schema и RLS, но `supabase_migrations.schema_migrations` отсутствует, а безопасного staging-проекта и воспроизводимого write-E2E нет. Поэтому создание тура, модерацию, бронирование, письма и оплату нельзя повторно прогнать без риска затронуть production.
4. Локальный полный SEO-crawl кандидата нашёл 2 критические ошибки и 516 предупреждений.
5. Производительность остаётся слабой: медиана Lighthouse четырёх ключевых страниц — **56**, главная загружает около **25 МБ**, блог — около **17,5 МБ**.
6. Production-аналитика не активирована: отсутствуют GTM, verification tokens и подтверждённые конверсии.
7. Расширенные acceptance-наборы сейчас красные: Stage 2 — 34/42, UX audit — 266/328, 61 падение и 1 skip. Часть падений — дефекты тестов, часть — реальные viewport/fixture проблемы. Firefox, WebKit, axe и реальные authenticated/email journeys не закрыты.

### Практическая оценка готовности

| Направление | Оценка | Состояние |
|---|---:|---|
| Архитектура продукта | 72/100 | Сильное доменное покрытие, но слишком широкая поверхность |
| Качество кода и тесты | 62/100 | Unit-слой силён, но acceptance-наборы красные и местами недостоверны |
| Безопасность приложения | 70/100 | Закрыты важные P0/P1; live-проверка БД и API-матрица не завершены |
| Supabase и данные | 68/100 | Live read-only schema/RLS подтверждены; нет migration history, advisors и staging write-E2E |
| Партнёрские интеграции | 75/100 | Честный внешний checkout; native booking недоступен у провайдеров |
| Основной booking funnel | 52/100 | Серверная логика и unit-контракты есть, но role-based DB/browser journey не воспроизводится |
| UX/UI | 65/100 | Сильная визуальная база, но полный UX audit нашёл 32 уникальных overflow-сценария |
| Доступность и браузеры | 62/100 | Lighthouse a11y высокий, но нет системного cross-browser/axe gate |
| Производительность | 35/100 | Критически тяжёлые изображения и высокий First Load JS |
| Техническое SEO | 58/100 | Кандидат лучше production, но crawl ещё красный |
| Контент и редактура | 48/100 | Большой объём, но 365 критичных записей в общем content audit |
| Аналитика и измеримость | 25/100 | Код событий есть, production-инструменты не включены |
| Наблюдаемость и эксплуатация | 50/100 | Sentry/cron-контур есть, но часть состояния недолговечна в serverless |
| Платежи и compliance | 45/100 | Архитектура есть, live-провайдеры и операционные процедуры не подтверждены |
| i18n | 30/100 | EN/ES пока fallback и правильно исключены из индексации |
| Release engineering | 35/100 | Красные acceptance-наборы, stale fixtures, двойной подсчёт и нет изолированного staging |

**Сводная профессиональная оценка после сценарного аудита: 56/100.** Отдельная готовность сквозных бизнес-сценариев — **44/100**: архитектура в основном существует, но доказательство путей tourist/organizer/admin пока неполное и невоспроизводимое. Это зрелая beta / release candidate-платформа, которой нужна не новая волна функций, а последовательная доводка качества, измеримости и эксплуатации.

## 2. Что и как проверено

### Свежие проверки текущего кандидата

| Проверка | Результат |
|---|---|
| `npm run audit:quick` | PASS |
| TypeScript | PASS |
| ESLint | PASS с 121 предупреждением |
| Unit tests | 200 файлов, 1054 теста — PASS |
| `npm run rls-audit` | 86 таблиц, критичных ошибок нет |
| `npm audit --omit=dev` | 0 critical, 0 high, 2 moderate |
| Production build | PASS, 874 статические страницы |
| Локальный production smoke | PASS |
| Playwright smoke | 13/13, Chromium — PASS |
| Domain-focused unit/contracts | 20 файлов, 68 сценариев auth/native booking/moderation/payment/RLS/privacy — PASS |
| Расширенный безопасный Playwright | 32 PASS, 4 FAIL, 3 SKIP; после изолированного повтора 3 flaky PASS, 1 устаревший mobile-auth test остался FAIL |
| Stage 2 visual acceptance | 34/42 PASS; 3 раза stale tour URL 404, 5 раз ошибочный auth locator |
| Полный UX audit | 266/328 PASS, 61 FAIL, 1 SKIP; 32 viewport-overflow, 26 timing/auth-wall, 2 stale-route, 1 modal test |
| UX JSON reporter | Ошибочно сообщает 118 violations при 61 уникальном падении: объединяет дубликаты с разными message |
| Локальный sitemap crawl | 606/606 URL, 2 critical, 516 warnings |
| Lighthouse кандидата | median perf 56, median a11y 100 — FAIL по performance |
| `npm run supabase:verify` | FAIL: `fetch failed` |
| `npm run auth:readiness` | PASS, проект `uooxrypocahomoqzdvzy` |
| Live DB read-only | Native columns/bucket применены; 86/86 public tables с RLS; случайные anon/auth видят 0 строк ключевых таблиц |
| Live migration history | FAIL: `supabase_migrations.schema_migrations` отсутствует |
| Authenticated write-E2E | Не запускался: `.env.local` связан с live DB, staging/local DB и E2E accounts отсутствуют |

### Проверенный production

- `/api/health` отвечает `ok=true`, база доступна.
- Production обслуживает commit `543ead8ac198d8e45e73b840221a460fb43cdb7b`.
- Опубликованный health сообщает migration meta `20260715032401_secure_auth_role_bootstrap`; локальный кандидат содержит 67 миграций до `20260715202136_native_tour_excursion_workflow`.
- Production sitemap содержит 1172 URL. Последний crawl зафиксировал 903 критические проблемы старой опубликованной версии; локальный кандидат сократил индекс до 606 RU-URL и оставил 2 критические ошибки.
- Последний production Lighthouse: median performance 49, median accessibility 97, worst CLS 0.668.

### Важное ограничение доказательств

Release-отчёты привязаны к последнему commit SHA, но рабочее дерево сильно изменено. Поэтому зелёный локальный отчёт ещё не является воспроизводимым доказательством релиза, пока кандидат не выделен в проверяемую версию и не прогнан в staging.

Особенно важно: документ `docs/release-readiness-2026-07/native-products-readiness.md` сообщает о прошлом real-DB QA с очисткой данных. Этот факт полезен как историческое свидетельство, но не заменяет повторяемый тест текущего кандидата: нет fixture manifest, test account contract, staging URL, trace и DB assertions, которые можно воспроизвести одной командой.

## 3. Полная карта сильных сторон и рисков

### 3.1. Продукт и приоритеты

Сильная сторона — продукт покрывает почти весь путь: discovery → контент → каталог → карточка → заявка/внешний checkout → кабинет → сообщения → оплата/возврат. Есть B2B-контур организатора и полноценная редакционная инфраструктура.

Главный риск — **распыление**. В репозитории одновременно развиваются туры, экскурсии, авиабилеты, страховка, трансферы, eSIM, аудиогиды, магазин, форум, эксперты, группы, PWA, AI-подбор и i18n. До стабилизации основного funnel новые supporting/experimental функции следует заморозить.

Рекомендуемый North Star на ближайшие 3 месяца:

> Доля пользователей, которые из качественной входной страницы доходят до подтверждённого целевого действия: внешний партнёрский checkout или сохранённая заявка на собственный продукт.

Вспомогательные показатели: CTR карточки, начало бронирования, успешный redirect/request, error rate, скорость LCP, доля индексируемых качественных страниц, supply собственных опубликованных предложений.

### 3.2. Код и архитектура

Фактическая поверхность:

- 129 `page.tsx`;
- 236 API route handlers;
- 2563 TypeScript-файла;
- 716 client components;
- 27 `force-dynamic`;
- 114 обращений к `localStorage`;
- 44 использования `dangerouslySetInnerHTML`;
- 32 TODO/FIXME/HACK-маркера;
- 25 явных `any`-паттернов.

Проблемы:

- 236 API routes требуют формальной матрицы owner/auth/rate-limit/idempotency/observability.
- В машинном продуктовом аудите 70 маршрутов имеют `auth_contract_not_obvious`.
- Нет Server Actions; почти любая операция проходит через Route Handler. Это допустимо, но увеличивает API-поверхность и стоимость защиты.
- Middleware весит около 92,9 КБ и делает проверки настроек, redirect registry, auth/profile и отдельный existence-fetch для detail routes. Build уже предупреждает о несовместимой Node API внутри Supabase-пакета в Edge Runtime.
- `next lint` устарел и должен быть заменён прямым ESLint CLI до Next.js 16.
- Локальный Node 24 расходится с CI Node 22; нужна воспроизводимая версия через `.nvmrc`/Volta и `engines`.

### 3.3. Supabase, Postgres и безопасность данных

Сильные стороны:

- 86 таблиц и 86 включений RLS;
- 192 policy-объявления;
- 200 индексов;
- атомарные операции создания/отмены бронирования;
- отдельные hardening-миграции ролей, conversations, idempotency и outbox;
- static RLS gate сейчас зелёный.

Открытые риски:

- `supabase:verify` не подключился, поэтому static audit нельзя считать live-доказательством.
- В истории миграций остаются 2 использования устаревшего `auth.role()`.
- Найдено 12 вхождений `SECURITY DEFINER`, включая повторные определения. Нужен live-аудит `EXECUTE`, `search_path`, ownership и фактических callers.
- Нужна проверка отсутствующих FK-индексов и планов запросов через advisors/SQL, а не только анализ файлов.
- С 2026 Supabase постепенно меняет default grants: новые таблицы могут не попадать в Data API без явного `GRANT`. Это нужно включить в миграционный шаблон и verifier: [официальное изменение Supabase](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically).
- Supabase изменяет default `pg_graphql`; если GraphQL когда-либо используется, включение должно быть явным: [официальное изменение](https://supabase.com/changelog/42180-breaking-change-pg-graphql-no-longer-enabled-automatically-within-approx-3-weeks).

### 3.4. Auth, API security и rate limiting

Недавние правки закрывают self-role escalation, cron auth, booking lookup disclosure и conversation participant writes. Это существенный прогресс.

Но остаются системные задачи:

- формальная capability-матрица для 236 API routes;
- negative tests для BOLA/IDOR по tourist/organizer/admin;
- durable rate limiting: только 26 route-файлов явно используют limiter, а при отсутствии/ошибке Upstash код откатывается на память одного процесса;
- `UPSTASH_REDIS_REST_*` отсутствуют в `.env.example`, production-конфигурация не доказана;
- Content-Security-Policy отсутствует; есть HSTS, frame/content/referrer/permissions headers;
- 44 HTML/script injection points должны иметь реестр источника и sanitizer/serializer contract.

### 3.5. CI/CD и release engineering

Сильные стороны: собственный release gate, production isolation, smoke, migration meta, content checks, artifacts.

Критичная ошибка `.github/workflows/ci.yml`: шаг `Wait for matching production deployment` выполняется и для `pull_request`. PR SHA обычно не может уже обслуживаться production, поэтому job способен ждать 10 минут и падать. Production wait/smoke/visual должны запускаться только после push/deploy main, а PR должен проверять preview/staging.

Дополнительно:

- branch protection не подтверждён локально;
- performance, bundle и UX audit частично `continue-on-error`;
- отчёт должен включать dirty-tree fingerprint, lockfile hash, migration delta и deployment ID;
- 89 переменных, читаемых кодом/скриптами, отсутствуют в `.env.example` — часть служебные, но runtime-контракт всё равно неполон.

### 3.6. Производительность и медиа

Это крупнейший пользовательский технический риск.

Свежий локальный мобильный Lighthouse:

| Маршрут | Perf | A11y | LCP | Передано |
|---|---:|---:|---:|---:|
| `/` | 47 | 100 | 59,5 с | ~25,0 МБ |
| `/tours` | 56 | 100 | 10,1 с | ~4,5 МБ |
| `/blog` | 45 | 100 | 9,7 с | ~17,5 МБ |
| `/destinations/patagonia` | 56 | 97 | 11,4 с | ~8,3 МБ |

Главные причины по network trace:

- `media/destinations/ba/section.jpg` — около 9,5 МБ;
- hero главной загружается одновременно с CDN и локального fallback — два файла примерно по 4,7 МБ;
- карточки блога грузят изображения по 1–3,3 МБ;
- глобальный `images.unoptimized` включается при наличии внешнего CDN;
- First Load JS: home 838 КБ, blog 801 КБ, guide/article часто 0,8–0,9 МБ, editor preview около 1,2 МБ;
- `/api/site/search-index` отдаёт около 283 КБ уже на первом экране;
- middleware и layout добавляют общую стоимость всем маршрутам.

### 3.7. SEO и индексирование

Кандидат сильно лучше старого production: sitemap уменьшен с 1172 до 606 URL, EN/ES fallback убраны из индексируемого набора, исчезли массовые 404 guide pages.

Осталось:

- P0/P1: `/excursions/city/Puerto_Iguazu` находится в sitemap, но отвечает без canonical и с noindex;
- 263 предупреждения длины description;
- 202 предупреждения длины title;
- 38 пар duplicate descriptions, преимущественно `/places/*` против `/baza-znaniy/*`;
- 4 пары duplicate titles;
- 7 страниц без `og:image`;
- 2 страницы без одного H1;
- после deploy нужен новый production crawl и отправка sitemap в GSC/Bing.

### 3.8. Контент, CMS и редактура

База знаний содержит 689 записей. Текущий content audit:

- 365 critical;
- 66 high;
- 433 не допускаются в публичный индекс;
- 226 non-Russian summary;
- 202 non-Russian title;
- 163 thin content;
- 28 sensitive материалов без источника;
- 20 без hero.

CMS readiness:

- blog 290/290 — 100%, cutover on;
- guide 5/5 — 100%, cutover on;
- destination 8/8 — 100%, cutover on;
- place 27/98 — 28%, cutover off.

Нельзя пытаться «закрыть 365 материалов» одним массовым AI-проходом. Нужны тематические пакеты, source registry, редакторское одобрение и публикационный quality gate.

### 3.9. Аналитика и рост

В коде определено 19 dataLayer-событий, consent-модель и verification meta. Но production readiness показывает:

- `NEXT_PUBLIC_GTM_ID` не задан;
- GTM snippet и dataLayer init отсутствуют в live HTML;
- Google/Bing/Ahrefs verification не завершена;
- конверсии `booking_submit`, `contact_form_submit`, `newsletter_subscribe` не подтверждены;
- нет доказанного funnel dashboard и регулярного отчёта.

Пока аналитика не включена, невозможно профессионально решать, какие функции развивать, а какие замораживать.

### 3.10. Партнёрские интеграции

Архитектурно выбран правильный product truth:

- Tripster External Orders возвращает 403 для текущего партнёра; гарантированный fallback заполняет только дату и время `HH:MM`.
- YouTravel booking endpoints возвращают 405; используется внешний checkout.
- Sputnik8 — affiliate-first.
- Travelpayouts оборачивает внешние ссылки для атрибуции.

Следующий профессиональный шаг — не имитировать native booking, а измерить успешность redirect и договориться с провайдерами о доступе. Весь UI должен строиться из единого capability resolver.

### 3.11. Собственные туры, организатор и CRM

Кандидат уже содержит workflow собственных туров и экскурсий, approved snapshot, inventory, moderation, media и native booking. Это стратегически важнее добавления новых affiliate-сервисов.

До публичного обещания нужны:

- DB-backed E2E на staging;
- две роли организатора и администратора;
- повторная модерация при сохранении старой публичной версии;
- overbooking/idempotency/concurrency fixtures;
- email outbox и уведомления;
- мобильная приёмка редактора;
- операционный SLA модерации и поддержки.

### 3.12. Платежи, возвраты и compliance

Stripe/Mercado Pago, webhooks, журнал транзакций и возвраты реализованы архитектурно. Но production enablement нельзя делать только по наличию кода.

Нужны: sandbox E2E, provider dashboard, подписи webhook, reconciliation, чеки/налоги, legal owner, договоры с организаторами, refund SLA, dispute process, резервное копирование финансового журнала и инструкция инцидента. До этого capability — `manual`/`payment_link`, а не обещание онлайн-оплаты.

### 3.13. Наблюдаемость и эксплуатация

Sentry подключён в коде и используется в booking/payment/cron/map. Но активность DSN в production не доказана.

Cron health сохраняется в `var/ops` и process memory. На Vercel эти данные недолговечны и не образуют надёжного журнала между invocations. Результаты cron, outbox и operational incidents должны храниться в Supabase/внешней системе; Slack/Sentry — канал уведомления, а не единственный источник истины.

### 3.14. Доступность и браузеры

Lighthouse a11y высокий, UI-аудиты сделали много полезных исправлений. Однако:

- основной Playwright config — только Desktop Chrome;
- stage2 mobile/tablet использует Chromium device emulation, не WebKit;
- axe gate не настроен;
- остаются предупреждения ARIA/alt;
- нужны реальные keyboard/focus/zoom journeys для auth, booking, кабинетов и page builder.

### 3.15. i18n

EN/ES сейчас используют fallback-контент и правильно noindex. Публиковать эти локали нельзя, пока нет locale-aware registry для каждой страницы, self-canonical, reciprocity hreflang и редакционной готовности. RU-first остаётся правильным фокусом.

### 3.16. Сквозная сценарная готовность: турист → организатор → администратор

#### Шкала доказательств

- **L4 — подтверждено сквозно:** браузер, API, реальная staging DB/RLS, ответ и cleanup.
- **L3 — подтверждено интеграционно:** production-like браузер/API или read-only live DB, но без полного write-path.
- **L2 — подтверждено контрактами:** unit/source/SQL tests проходят, реальная запись не повторена.
- **L1 — существует в коде:** маршрут/UI найден, но автоматического доказательства нет.
- **L0 — отсутствует/сломано.**

Профессиональный release-ready стандарт для критичных сценариев — L4. Исторический отчёт о прошлом production QA не повышает текущий сценарий до L4 без воспроизводимых fixtures, trace и привязки к SHA.

#### Матрица бизнес-сценариев

| № | Роль и сценарий | Фактически подтверждено | Уровень | Статус / главный пробел | Спринт |
|---:|---|---|:---:|---|---:|
| 1 | Гость: главная → каталог → фильтры → карточка | Public smoke, SSR и production-like страницы работают; каталог отдаёт партнёрские предложения | L3 | 🟡 Системный UX audit фиксирует overflow; detail fixture `patagonia-glaciers` умер | 0A, 3, 10 |
| 2 | Гость: тур/экскурсия → дата → CTA | Серверные capability/mapper tests проходят | L2 | 🟡 Браузерные partner tests пропускаются без fixture slugs; native detail journey отсутствует | 0A, 6 |
| 3 | Партнёрский checkout Tripster/YouTravel/Sputnik8 | В коде честный affiliate fallback; известны 403/405 провайдеров | L2 | 🟡 Нужны стабильные staging fixtures и redirect/attribution assertions; никаких реальных платных заказов | 6 |
| 4 | Регистрация туриста и подтверждение email | UI и auth provider существуют; role hardening unit tests проходят | L2 | ❌ Нет disposable mailbox, реального signup/confirm, session persistence и cleanup | 0A, 1 |
| 5 | Вход/выход/неверный пароль | Auth modal работает, включая mobile menu | L3 | 🟡 Тест ищет скрытую desktop-кнопку на mobile и ложно падает | 0A, 10 |
| 6 | Reset password: запрос → письмо → ссылка → новый пароль | Ошибки/таймер/recovery guard проверены UI-тестом | L2 | ❌ Реальное письмо, expired/replay link и global sign-out не проверены | 0A, 1 |
| 7 | Турист: профиль, избранное, сохранённые материалы | Auth-wall и unit stores существуют | L1–L2 | ❌ Нет authenticated browser/API/DB assertions | 0A, 10 |
| 8 | Турист: просмотр своих заявок и guest attach/lookup | OTP privacy contracts и read-only isolation проходят | L2 | 🟡 Реальный OTP/mailbox, purpose-bound session, guest attach и cabinet visibility не повторены | 0A, 6 |
| 9 | Заявка организатора и доверенное назначение роли | API/onboarding существуют; self-admin escalation закрыт тестами | L2 | ❌ Нет двухаккаунтного journey applicant → admin approve → organizer access | 0A, 1, 7 |
| 10 | Организатор: создать тур/экскурсию | Editor генерирует draft и PATCH upsert; live DB содержит native schema и bucket | L2 | ❌ Нет текущего authenticated browser → API → DB сценария; UI сначала сохраняет локальный draft, затем remote sync | 0A, 7 |
| 11 | Организатор: autosave, reload, cross-device conflict | 409/force-sync логика и conflict UI присутствуют | L1–L2 | ❌ Нет двух browser contexts и DB version assertion | 0A, 7 |
| 12 | Организатор: загрузка/замена/удаление media | Ownership, size/type и storage policies есть; bucket применён | L2 | 🟡 Не проверены реальные upload/upsert/delete и orphan cleanup | 0A, 1, 7 |
| 13 | Организатор: readiness → отправка на модерацию | Server readiness, slug uniqueness, draft size/data-URL guards проверены контрактами | L2 | ❌ Нет UI validation matrix и реальной pending row assertion | 0A, 7 |
| 14 | Админ: очередь → approve/reject → audit actor | API и moderation ordering tests есть; admin UUID обязателен для service calls | L2 | ❌ Нет staff capability accounts, authenticated UI/API и audit-log assertions | 0A, 1, 7 |
| 15 | Публичная публикация и повторная модерация | Approved snapshot и скрытие draft подтверждены SQL/source tests | L2–L3 | 🟡 Live columns применены, но create→approve→public→edit→reject не повторён на staging | 0A, 7 |
| 16 | Даты, остатки, overbooking и waitlist | Atomic create/cancel RPC ограничены service_role; unit integrity проходит | L2–L3 | ❌ Нет конкурентного DB-теста на реальной staging schema и UI состояния sold-out | 0A, 6, 7 |
| 17 | Native booking: цена → запись → подтверждение | Server price snapshot, atomic RPC, idempotency и email outbox contracts проходят | L2 | ❌ Не повторён browser→API→DB→tourist/organizer/admin; POST также может отправить email | 0A, 6 |
| 18 | Организатор: CRM заявки, статусы, комментарии | Страницы/API/state machine есть | L1–L2 | ❌ Нет dynamic authenticated E2E, owner/other-organizer negative journey и согласованности трёх кабинетов | 0A, 7 |
| 19 | Переписка турист ↔ организатор | Live случайный пользователь видит 0 строк; participant RLS tests проходят | L2–L3 | 🟡 Нет двухсессионного send/read/typing/realtime/notification journey и IDOR assertions | 0A, 1, 7 |
| 20 | Уведомления и email outbox | Outbox закрыт от anon/auth; security tests проходят | L2–L3 | ❌ Нет worker delivery/retry/dead-letter и mailbox assertion | 0A, 2, 7 |
| 21 | Отмена заявки и освобождение места | Atomic cancellation RPC только service_role; integrity test проходит | L2–L3 | ❌ Нет UI/RBAC/concurrency/notification E2E | 0A, 6 |
| 22 | Оплата, webhook, повтор, refund | Sandbox/integrity unit tests проходят | L2 | ❌ Нет provider sandbox, signed webhook, reconciliation и receipt journey | 0A, 9 |
| 23 | Админ: CMS, staff, settings, redirects, privacy | Большая поверхность UI/API есть; auth-wall появляется | L1–L2 | ❌ Нет permission presets, least-privilege accounts и CRUD browser/DB assertions | 0A, 1, 8, 10 |
| 24 | Privacy export/delete | Automation/unit и owner RLS существуют | L2 | ❌ Нет end-to-end idempotent retry между Auth/profile/bookings и retention assertions | 0A, 1, 9 |
| 25 | Cron/outbox/reconciliation/incident | Route auth hardening есть | L1–L2 | ❌ Нет durable run ledger, serverless-proof monitoring и recovery rehearsal | 2 |

#### Что прогнано в этом аудите

1. Production-like сервер на `127.0.0.1:3100` из `.next-production`.
2. 20 domain-focused test-файлов, 68 сценариев — все прошли.
3. Безопасный Playwright-набор: 32 pass, 4 fail, 3 skip; после одиночного повтора recovery и iPhone SE прошли, mobile login test стабильно остался красным из-за неправильного entry action.
4. Stage 2 visual: 34/42; реальные auth-диалоги присутствуют, но locator выбирает скрытый cookie-текст; tour fixture отвечает 404.
5. Полный UX audit: 328 проверок за 16,8 минуты; 266 pass, 61 fail, 1 skip. Уникально: 32 viewport-overflow, 26 преждевременных auth-wall checks, 2 stale-route и 1 modal check.
6. Live DB read-only: native columns/bucket применены, 86/86 public tables с RLS, 176 live policies, 9 `SECURITY DEFINER`, 2 live legacy `auth.role()` policy expressions.
7. Random anon/authenticated UUID видит 0 строк в `tours`, `bookings`, `moderation_queue`, conversations и privacy; outbox не имеет table grant.
8. Privileged booking create/cancel/OTP RPC имеют EXECUTE только у `service_role`. Trigger/helper functions с default PUBLIC execute требуют явного revoke review.

#### Почему write-сценарии не запускались повторно

`.env.local` указывает на live Supabase `uooxrypocahomoqzdvzy`, а подключённый Supabase MCP видит другой проект. Локального Supabase/Docker нет, E2E test accounts и disposable mailbox не настроены. Запуск booking lookup создаёт challenge/audit rows; native booking создаёт заявку и может поставить письмо в outbox; moderation меняет публичный продукт. Без отдельного staging это непрофессиональный риск, а не «полнота тестирования».

#### Итог сценарного аудита

Система **архитектурно покрывает** почти все нужные бизнес-пути, но **операционно не доказана** как единый продукт. Наиболее критичный пробел — отсутствие одного воспроизводимого acceptance harness, который создаёт изолированные роли/данные, проводит 25 journeys, проверяет БД и очищает только свои fixtures. До появления этого harness утверждение «создание тура, бронирование и администрирование полностью готовы» преждевременно.

## 4. Приоритетный реестр блокеров

### P0 — до любого deploy кандидата

1. Зафиксировать воспроизводимый release candidate и отделить его от 483 файлов незакреплённой работы.
2. Исправить CI-разделение PR/preview и post-deploy production checks.
3. Создать изолированный staging Supabase с тремя ролями, disposable mailbox, sandbox payments и fixture namespace; никакие acceptance tests не должны писать в production.
4. Восстановить доверие к Playwright: заменить stale `/tours/patagonia-glaciers`, mobile login entry, auth-wall timing/locators, overflow semantics и двойной подсчёт reporter.
5. Провести staging verification, migration/advisor rehearsal и все критичные write-journeys из матрицы 3.16.
6. Исправить `/excursions/city/Puerto_Iguazu` в sitemap/canonical/noindex.
7. Повторить полный release gate на том же SHA и deployment URL; Stage 2 и UX audit должны быть блокирующими и зелёными.

### P1 — до публичного масштабирования трафика

1. Снизить изображения и LCP; убрать двойную загрузку CDN/local.
2. Включить аналитику, consent и поисковые верификации.
3. Добавить durable rate limiting и API auth matrix.
4. Включить Sentry/uptime и durable cron audit.
5. Пройти Firefox/WebKit/axe и реальные auth/email journeys.
6. Закрыть top SEO metadata/duplicate clusters.

### P2 — после стабилизации core funnel

1. Native organizer supply и CRM.
2. CMS places cutover тематическими пакетами.
3. Sandbox payments/refunds/compliance.
4. Сокращение API/client surface и Next.js platform upgrade.
5. Полный i18n только после доказанной RU-экономики.

## 5. Общий Definition of Done для каждого спринта

Каждый спринт считается завершённым только если:

1. Есть «Влияние изменений на проект»: турист, организатор, администратор, booking, CRM, аналитика, будущая оплата.
2. Нет перезаписи чужих изменений и массового форматирования.
3. Добавлены regression tests на изменённое поведение.
4. `npm run audit:quick` проходит.
5. Для БД: migration + live/staging check + `rls-audit` + advisors.
6. Для партнёров: targeted unit/E2E и обновление `docs/integrations/`.
7. Для UI: 390/768/1440, keyboard, loading/empty/error.
8. Для релиза: отчёт привязан к SHA, deployment URL и migration ID.
9. Документация обновлена и не противоречит фактическому состоянию.
10. Агент не делает commit/push/deploy без отдельного разрешения владельца.
11. Для критичного бизнес-пути есть доказательство UI → API → DB/RLS → response → UI, а не только source/unit test.
12. E2E fixtures имеют namespace/run ID, cleanup `finally`, TTL-janitor и запрет production project ref.
13. Ни один обязательный тест не `skip` из-за отсутствующего fixture slug, test account или provider sandbox.

## 6. Дорожная карта на 13 спринтов + обязательный Sprint 0A

Базовая длина — 2 недели. Sprint 0 — 3–5 рабочих дней. Спринты 3–5 допускают частичное параллельное выполнение после закрытия Sprint 1, но финальную интеграцию ведёт один ответственный агент.

| Спринт | Фокус | Главный результат |
|---|---|---|
| 0 | Release containment | Воспроизводимый кандидат и корректный CI |
| 0A | End-to-end acceptance foundation | Изолированный staging и доказуемые tourist/organizer/admin journeys |
| 1 | Supabase/Auth/Security | Подтверждённая live-модель доступа |
| 2 | Reliability/Observability | SLO, Sentry, durable jobs и backup rehearsal |
| 3 | Performance/Media | LCP и вес страниц в допустимом бюджете |
| 4 | Technical SEO | Чистый sitemap crawl и canonical registry |
| 5 | Analytics/Consent | Измеряемый funnel и поисковая верификация |
| 6 | Core booking funnel | Единая product truth для native/partner |
| 7 | Native supply/CRM | Полный путь организатора и модерации |
| 8 | Content/CMS | Управляемая редакционная фабрика |
| 9 | Payments/Compliance | Sandbox-ready финансовый контур |
| 10 | Accessibility/Browsers | WCAG и cross-browser release gate |
| 11 | Architecture/Platform | Снижение техдолга, API-контракты, Next upgrade plan |
| 12 | i18n/Growth | Контролируемое расширение после core readiness |

---

## Sprint 0. Стабилизация release candidate

### Цель

Превратить текущее большое рабочее дерево в воспроизводимый, проверяемый релизный кандидат без потери работы.

### Объём

- Снять machine-readable inventory текущих изменений и предложить безопасное разбиение на PR/пакеты.
- Исправить CI: PR → local/preview gates; main post-deploy → wait production SHA + smoke.
- Добавить dirty-tree/lockfile/migration fingerprint в release report.
- Синхронизировать противоречащие друг другу release docs.
- Сверить `.env.example` с runtime variables и разделить required/optional/tooling.
- Закрыть единственный локальный SEO critical `/excursions/city/Puerto_Iguazu`.
- Исправить stale Playwright fixtures, mobile auth entry, auth-wall ожидание, overflow false positives и двойной подсчёт UX reporter.

### Критерии выхода

- Release gate работает на PR без ожидания production SHA.
- Кандидат имеет однозначный состав файлов, migration delta и checklist ручных действий.
- Локальный SEO crawl: 0 critical.
- `audit:quick`, build и smoke проходят.
- Stage 2: 42/42; UX audit: 328/328 или явно пересобранный актуальный manifest без skips и ложных positive.
- Ни один обязательный partner/native fixture не пропущен молча.

### Готовый промпт

```text
Ты — ведущий release-инженер проекта «Пора в Аргентину».

Задача: выполнить Sprint 0 — стабилизировать текущее большое рабочее дерево и подготовить воспроизводимый release candidate. Не делай commit, push, deploy и не удаляй файлы без моего отдельного разрешения.

Сначала прочитай AGENTS.md, все .cursor/rules/, docs/ai-first/, docs/release-readiness-2026-07/ и docs/audit/full-project-readiness-roadmap-2026-07-15.md. Проверь git status: чужие изменения сохраняй, никаких reset/checkout/mass formatting.

Можно создать до 3 подагентов: (1) read-only аудит CI/release reports, (2) read-only аудит env/docs consistency, (3) SEO regression analysis. Подагенты не должны редактировать одни и те же файлы; интеграцию и финальные решения выполняешь ты.

Сделай:
1. Покажи «Влияние изменений на проект» и план.
2. Исправь .github/workflows/ci.yml: PR не ждёт production SHA; post-deploy проверки запускаются только после подходящего события/deployment.
3. Добавь в release report fingerprint dirty tree, package-lock, migration delta и ожидаемый migration ID.
4. Сверь .env.example с runtime env и классифицируй required/optional/tooling; не трогай секреты.
5. Устрани локальный SEO critical /excursions/city/Puerto_Iguazu без индексации пустой/несуществующей страницы.
6. Обнови release-readiness документы так, чтобы verdict, migration state и проверки не противоречили друг другу.
7. Исправь acceptance infrastructure: актуальный tour fixture, mobile menu login, web-first auth-wall ожидание, осмысленное исключение только намеренно прокручиваемых контейнеров и дедупликацию UX reporter по route×viewport×check.
8. Предложи разбиение текущего diff на небольшие логические PR, но не создавай commits.

Проверки: npm run audit:quick, npm run release:gate, локальный production smoke, Playwright smoke, Stage 2 visual, полный UX audit и полный локальный seo-audit. Не принимай красный тест как «известное исключение» без доказательства. В финале дай: изменённые файлы, точные counts pass/fail/skip, доказательства, оставшиеся ручные действия, «Синхронизация проекта».
```

## Sprint 0A. Изолированный сквозной acceptance-gate

### Цель

Сделать сценарии создания тура, модерации, публикации, бронирования, CRM и администрирования воспроизводимыми и безопасными — одной командой, без записи в production.

### Объём

- Отдельный staging Supabase/preview, disposable mailbox и provider sandbox.
- Fixtures: tourist, organizer applicant, approved organizer, limited admin, full admin, native tour, native excursion, availability slot и guest booking.
- 25 journeys из матрицы 3.16 с UI/API/DB assertions.
- Негативные роли: anonymous, чужой tourist, чужой organizer, limited staff, replay request.
- Run namespace, cleanup `finally`, TTL janitor, trace/video/screenshot и DB evidence manifest.
- Hard guard: тест немедленно падает, если project ref или base URL совпадает с production.

### Критерии выхода

- Все критичные сценарии имеют L4 evidence.
- 0 failed, 0 unexpected skips, 0 orphan fixtures после cleanup.
- В отчёте есть SHA, deployment URL, Supabase ref, migration set, run ID и ссылки на traces.
- Повторный параллельный запуск не создаёт дублей, overbooking или cross-user data leaks.

### Готовый промпт

```text
Ты — ведущий QA/SDET и release-инженер проекта «Пора в Аргентину».

Задача: выполнить Sprint 0A из docs/audit/full-project-readiness-roadmap-2026-07-15.md и построить безопасный, воспроизводимый сквозной acceptance-gate. Не запускай write-сценарии, пока не докажешь, что base URL и Supabase project ref НЕ production. Не меняй .env/секреты, не делай commit/push/deploy без отдельного разрешения.

Сначала прочитай AGENTS.md, все .cursor/rules/, docs/ai-first/, docs/release-readiness-2026-07/, раздел 3.16 отчёта и текущие Playwright configs. Используй verification-подход: UI → API → DB/RLS → response → UI. Для Supabase прочитай skills supabase и supabase-postgres-best-practices и актуальный changelog.

Можно создать до 3 подагентов: (1) fixtures/auth/mailbox staging, (2) organizer→moderation→public journeys, (3) booking→CRM→payment/privacy negative journeys. Подагенты сначала возвращают read-only plan; lead владеет shared fixtures, cleanup и production guard.

Сделай:
1. Выведи безопасный environment fingerprint без секретов: SHA, base URL, Supabase ref, migration state, mail/payment sandbox flags. При совпадении с production остановись.
2. Создай namespaced fixtures для tourist, organizer applicant, organizer, limited/full admin, native tour/excursion, slots и booking; все созданные IDs записывай в manifest.
3. Автоматизируй все 25 journeys из матрицы 3.16. Для каждого сохрани browser assertion, request/response, DB row/status assertion и проверку видимости другой ролью.
4. Обязательно проверь: signup/confirm/reset; organizer approval; create/autosave/conflict/media; submit/approve/reject/approved snapshot; public catalogs; capacity/concurrency; native booking; tourist/organizer/admin cabinets; messages; notifications/outbox; cancellation; payment sandbox/webhook replay/refund; privacy export/delete.
5. Добавь негативные BOLA/IDOR/replay/duplicate/expired-token/invalid-transition сценарии.
6. Cleanup выполняй в finally только по run namespace/manifest; добавь TTL janitor и отдельную проверку 0 orphan rows/files.
7. Исключи реальные письма/списания/partner orders: только disposable mailbox и sandbox/mock. Partner redirect проверяй до handoff.
8. Сформируй machine-readable scenario report: pass/fail/skip, duration, evidence links, DB cleanup, blocker owner.

Проверки: audit:quick, rls-audit, supabase:verify на staging, полный Playwright acceptance в Chromium/WebKit, повторный параллельный прогон критичных booking/moderation scenarios. Финал: таблица 25 journeys с L4 evidence и «Синхронизация проекта».
```

## Sprint 1. Supabase, auth и security hardening

### Цель

Подтвердить реальную, а не только статическую безопасность данных и ролей.

### Объём

- Staging migration rehearsal всех 67 миграций.
- Live schema/RLS/advisors/grants/function privilege audit.
- Восстановление штатной migration history: live schema сейчас применена, но `supabase_migrations.schema_migrations` отсутствует.
- Замена legacy `auth.role()` актуальными policies.
- Проверка всех `SECURITY DEFINER`, `search_path`, EXECUTE и caller identity; live-аудит нашёл 9 функций, у trigger/helper функций остаётся default PUBLIC execute.
- Missing FK indexes и RLS performance.
- API auth/capability matrix и negative BOLA/IDOR tests.
- Durable Upstash limiter для auth, AI, lookup, booking и webhook endpoints.
- CSP strategy с учётом GTM, widgets и JSON-LD.

### Критерии выхода

- `supabase:verify`, advisors и RLS live checks зелёные на staging.
- Нет публично вызываемых опасных privileged functions.
- Все чувствительные API имеют owner, auth, limiter и negative test.
- Migration template учитывает explicit grants Supabase 2026.

### Готовый промпт

```text
Ты — ведущий инженер безопасности и Supabase проекта «Пора в Аргентину».

Выполни Sprint 1 из docs/audit/full-project-readiness-roadmap-2026-07-15.md. Обязательно используй skills supabase и supabase-postgres-best-practices, сначала прочитай их полностью, официальный Supabase changelog, AGENTS.md, .cursor/rules/supabase-development.mdc, global-system-approach и docs/ai-first/SECURITY.md/DATABASE.md.

Не применяй миграции к production и не меняй секреты без явного разрешения. Если подключён Supabase MCP, сначала определи project/staging target и покажи его без вывода ключей.

Можно создать до 3 подагентов: (1) API auth matrix read-only, (2) SQL/RLS/function audit read-only, (3) security test inventory. Только ведущий агент меняет миграции и общие security helpers.

Сделай:
1. «Влияние изменений на проект» и threat model: tourist/organizer/admin/service/partner/webhook.
2. Проверь 86 таблиц, 176 live policies, grants, RLS, views, storage, 9 live SECURITY DEFINER и 2 live policy expressions с deprecated auth.role(). Отдельно проверь default PUBLIC execute у trigger-only функций.
3. Запусти advisors и запрос missing FK indexes; исправляй только подтверждённые проблемы через новые миграции.
4. Построй машинную матрицу всех API routes: method, public/auth, capability, owner predicate, rate limit, idempotency, audit log.
5. Закрой P0/P1 BOLA/IDOR negative tests.
6. Сделай durable rate limit обязательным для чувствительных public routes; production не должен молча полагаться только на память процесса.
7. Подготовь безопасную CSP-стратегию, не ломая GTM/partner widgets; внедряй по report-only → enforce.
8. Обнови migration template: explicit GRANT + RLS + policies + indexes + type sync.
9. Предложи безопасный способ восстановить/нормализовать migration history без повторного применения всего каталога SQL и без изменения production до моего разрешения.

Проверки: supabase:verify на staging, rls-audit, advisors, audit:security, audit:quick, targeted auth/booking tests. Финал: findings по severity, миграции, доказательства, rollback/forward-fix и «Синхронизация проекта».
```

## Sprint 2. Надёжность, наблюдаемость и эксплуатация

### Цель

Сделать сбои видимыми, фоновые процессы — доказуемыми, восстановление — отрепетированным.

### Объём

- Подтвердить production Sentry DSN, source maps, release/environment tags.
- Durable cron execution log вместо `var/ops`/memory.
- Outbox monitoring: pending/failed/dead, alerts и retention.
- Uptime/health checks с dependency breakdown.
- SLO/SLI для публичного сайта, booking, partner redirects, cron и email.
- Backup данных и schema, restore rehearsal, RPO/RTO.
- Cost/quota alerts: Supabase egress/storage, Vercel bandwidth/functions, image proxy.

### Критерии выхода

- Тестовый exception виден в Sentry с release SHA.
- Каждый cron имеет durable run record и alert.
- Backup восстановлен на staging и измерены RPO/RTO.
- Есть операционный runbook и владелец инцидента.

### Готовый промпт

```text
Ты — ведущий SRE/observability-инженер проекта «Пора в Аргентину».

Выполни Sprint 2 по docs/audit/full-project-readiness-roadmap-2026-07-15.md. Прочитай AGENTS.md, docs/observability-e90.md, docs/cron-e71.md, docs/DEPLOY.md, docs/ai-first/DEPLOYMENT.md/SECURITY.md и текущие monitoring/cron/outbox файлы.

Можно создать до 3 подагентов: (1) Sentry/error coverage, (2) cron/outbox durability, (3) backup/SLO/cost runbooks. Не допускай параллельных правок общей схемы.

Сделай:
1. Покажи влияние на туриста, организатора, админа, бронирование, оплату и поддержку.
2. Убери зависимость operational truth от var/ops и process memory в Vercel: сохраняй cron runs и health в durable storage.
3. Проверь Sentry init, server/client/edge capture, release SHA, source maps и PII policy.
4. Добавь метрики/alerts для booking errors, partner fallback rate, payment webhook, email outbox, cron failure и DB health.
5. Определи SLO/SLI и error budgets; сделай админский operational dashboard минимальным, но достоверным.
6. Проведи schema+data backup/restore rehearsal на staging; задокументируй RPO/RTO и forward-fix.
7. Добавь quota/cost alerts для Supabase, Vercel и media CDN.

Не отправляй тестовые сообщения реальным пользователям и не меняй production env без разрешения. Проверки: audit:quick, targeted monitoring/cron tests, staging fault injection, documented alert evidence. Финал: dashboard/runbook/риски и «Синхронизация проекта».
```

## Sprint 3. Производительность и медиапайплайн

### Цель

Сделать ключевые страницы быстрыми на реальном мобильном соединении.

### Объём

- Responsive WebP/AVIF variants на media CDN.
- Убрать глобальный `unoptimized` и двойную загрузку CDN/local fallback.
- Hero preload/fetchpriority только для реального LCP.
- Lazy loading ниже fold; ограничение карточек и search index.
- Dynamic import тяжёлых карт, галерей, редакторов и виджетов.
- Сократить client boundary/root providers и First Load JS.
- Упростить middleware network path.

### Бюджеты

- `/`, `/tours`, `/blog`, destination: mobile Lighthouse median ≥75.
- LCP ≤4 с в лаборатории как промежуточная цель, затем ≤2,5 с.
- CLS ≤0,1; TBT ≤300 мс.
- Home transfer ≤2,5 МБ; контентная страница ≤1,5 МБ.
- First Load JS ключевых публичных страниц ≤350 КБ.

### Готовый промпт

```text
Ты — ведущий web-performance инженер Next.js проекта «Пора в Аргентину».

Выполни Sprint 3 по docs/audit/full-project-readiness-roadmap-2026-07-15.md. Используй skill nextjs; полностью прочитай AGENTS.md, .cursor/rules/, next.config.ts, media resolver/SafeImage, docs/media-guidelines-e64.md и свежий Lighthouse report var/ops/lighthouse-candidate-audit-2026-07-15.json.

Можно создать до 3 read-only подагентов: (1) network/image trace, (2) bundle/client-boundary trace, (3) middleware/data-fetch trace. Ведущий агент реализует и интегрирует изменения.

Baseline: home ~25 МБ, blog ~17,5 МБ; home perf 47/LCP 59,5s; First Load JS home 838 КБ. Главные тяжёлые файлы перечислены в аудите.

Сделай:
1. Зафиксируй baseline и LCP element/resource для 4 маршрутов.
2. Создай responsive WebP/AVIF pipeline и manifest contract; не загружай оригиналы 3–10 МБ в карточках.
3. Устрани одновременную загрузку CDN и local fallback.
4. Не отключай Next Image Optimization глобально из-за одного CDN; выбери loader/proxy/variants осознанно.
5. Отложи search-index, карты, галереи, widgets и нижние секции до взаимодействия/viewport.
6. Сократи root client providers и page bundles; используй Server Components там, где нет интерактива.
7. Упростить middleware: не делать лишние сетевые обращения на каждый публичный запрос.
8. Добавь blocking performance budgets в CI для ключевых маршрутов.

Проверки: build, audit:quick, Lighthouse 3 cold runs на маршрут, network bytes, CLS, mobile 390. Нельзя ухудшать SEO, alt и fallback UX. Финал: before/after таблица и «Синхронизация проекта».
```

## Sprint 4. Техническое SEO и архитектура индексирования

### Цель

Получить чистый индексируемый RU-контур без 404, noindex в sitemap, каннибализации и ложных локалей.

### Объём

- 0 critical в полном crawl.
- Единый route publication registry.
- Self-canonical, robots, hreflang, sitemap и redirects из одного источника.
- Разрешить дубли `/places` vs `/baza-znaniy` по search intent.
- Metadata quality batches.
- GSC/Bing submit после deploy.

### Готовый промпт

```text
Ты — ведущий technical SEO-инженер Next.js проекта «Пора в Аргентину».

Выполни Sprint 4 из docs/audit/full-project-readiness-roadmap-2026-07-15.md. Прочитай AGENTS.md, editorial-standard, docs/seo-e78.md, docs/audit/content-seo-audit-2026-07-15.md, sitemap/robots/metadata/redirect код и var/ops/seo-audit-last.json.

Можно создать до 3 подагентов: (1) sitemap/canonical/robots, (2) duplicate clusters и intent mapping, (3) structured data/metadata QA. Не разрешай массово переписывать чувствительный контент без источников.

Сделай:
1. Покажи влияние на discovery, каталог, CMS, redirects и аналитику.
2. Устрани все critical: sitemap URL обязан быть 200, indexable и self-canonical либо исключён.
3. Создай единый publication registry для RU и будущих locale; sitemap, canonical и noindex должны использовать его.
4. Разбери 38 duplicate-description clusters places vs knowledge base: merge/redirect/canonical/different intent — решение по каждой группе.
5. Исправь top metadata warnings пакетами: title, description, H1, og:image; не делай SEO-спам.
6. Проверь JSON-LD только для реально существующих сущностей/слотов.
7. Проверь redirect loops/chains и корректный lastModified.
8. Подготовь post-deploy GSC/Bing checklist.

Проверки: полный локальный crawl 100%, 0 critical; representative structured-data validation; audit:quick; после deploy повторный production crawl. Финал: URL decision ledger, before/after и «Синхронизация проекта».
```

## Sprint 5. Аналитика, consent и продуктовые метрики

### Цель

Начать принимать решения на данных, а не по количеству реализованных функций.

### Объём

- Production GTM/GA4/Yandex/Clarity по согласованной схеме.
- Consent Mode до загрузки необязательных tags.
- GSC/Bing/Ahrefs verification.
- Funnel events с едиными IDs и product capabilities.
- Dashboard acquisition → detail → booking → success/fallback.
- Weekly KPI review.

### Готовый промпт

```text
Ты — ведущий product analytics и consent-инженер проекта «Пора в Аргентину».

Выполни Sprint 5 по docs/audit/full-project-readiness-roadmap-2026-07-15.md. Прочитай AGENTS.md, docs/analytics-setup-report.md, analytics-gtm-setup.md, i2-analytics-gsc-runbook.md, compliance-e80.md и весь src/lib/analytics + consent UI.

Можно создать до 3 подагентов: (1) event taxonomy/code coverage, (2) consent/privacy QA, (3) dashboard/KPI design. Внешние env/GTM/GSC действия не выдумывай: дай владельцу точный ручной checklist и продолжай с тем, что можно проверить локально.

Сделай:
1. Определи North Star и KPI: landing→catalog→detail→booking_start→external_redirect/internal_submit→confirmed.
2. Нормализуй события, product_id/source/booking_mode/experiment/session attribution; запрети PII в analytics payload.
3. Гарантируй denied-by-default до consent; revoke должен прекращать сбор.
4. Проверь GTM/GA4/Метрику/Clarity без двойного page_view.
5. Добавь conversion и error/fallback события Tripster/YouTravel/native.
6. Подготовь dashboard и еженедельный readout с owner/target/guardrail.
7. Закрой verification meta и sitemap submission checklist.

Проверки: analytics-readiness, automated consent tests, Tag Assistant/DebugView evidence после ручной настройки, audit:quick. Финал: event dictionary, dashboard schema, ручные действия и «Синхронизация проекта».
```

## Sprint 6. Основной booking funnel и product truth

### Цель

Сделать один надёжный, понятный путь бронирования для каждого типа предложения.

### Объём

- Единый `ProductCapability` на listing/detail/CTA/checkout/account.
- Native request, external partner, information-only, payment-link — без ложных обещаний.
- Tripster/YouTravel/Sputnik8 fallback и attribution.
- Idempotency, retries, confirmation, support route.
- Conversion/error instrumentation.

### Готовый промпт

```text
Ты — ведущий product/booking инженер проекта «Пора в Аргентину».

Выполни Sprint 6 по docs/audit/full-project-readiness-roadmap-2026-07-15.md. Перед правками полностью прочитай AGENTS.md, global-system-approach, partner-apis.mdc, docs/integrations/tripster.md, youtravel.md, travelpayouts.md, sputnik8.md и capability matrix.

Можно создать до 3 подагентов: (1) native booking path, (2) partner checkout paths, (3) UX/copy/analytics QA. Каждый работает в отдельном наборе файлов; ведущий владеет общим capability resolver.

Сделай:
1. Построй единую capability model: booking/payment/availability/messaging/source/cancellation owner/data freshness.
2. Listing, detail, CTA, modal, mobile bar, account и analytics должны читать один resolver.
3. Tripster: External Orders 403 считается внешним fallback; URL time только HH:MM, server fallbackUrl as-is.
4. YouTravel: 405 booking endpoints → внешний checkout; не обещать внутреннюю заявку.
5. Sputnik8 — affiliate redirect до отдельного подтверждения native orders.
6. Native booking: серверная цена, availability, idempotency, confirmation и account visibility.
7. Сделай error/retry/support states и не создавай дубли при повторе.
8. Добавь сквозные events и partner attribution.
9. Используй fixture slugs из staging registry: обязательный provider test не должен skip из-за отсутствующей переменной.
10. Для native flow докажи UI → POST /api/bookings → atomic RPC → tourist/organizer/admin visibility → cancellation/release; письма только через staging outbox.

Проверки: audit:quick, partner regression, Tripster/YouTravel targeted tests, Chromium+WebKit E2E на staging, negative/error paths. Не выполняй реальные платные заказы. Финал: capability matrix фактического поведения и «Синхронизация проекта».
```

## Sprint 7. Собственные туры, экскурсии и CRM организатора

### Цель

Довести собственное предложение от черновика до подтверждённой заявки и работы CRM.

### Объём

- Draft autosave/cross-device recovery.
- Media upload и ownership.
- Readiness → moderation → approved snapshot → re-moderation.
- Inventory, schedule, capacity, waitlist.
- Booking inbox, messages, notifications, finance preview.
- Admin SLA и audit trail.

### Готовый промпт

```text
Ты — ведущий marketplace/CRM инженер проекта «Пора в Аргентину».

Выполни Sprint 7 по docs/audit/full-project-readiness-roadmap-2026-07-15.md. Прочитай AGENTS.md, global-system-approach, docs/release-readiness-2026-07/native-products-readiness.md, tour-editor-sync-e89.md, inventory-e96.md, organizer-onboarding-e98.md и миграцию 20260715202136_native_tour_excursion_workflow.sql.

Можно создать до 3 подагентов: (1) organizer editor/media, (2) moderation/public snapshot, (3) inventory/booking/CRM E2E. Миграции и общие domain types меняет только ведущий.

Сделай:
1. Полный impact map: organizer→admin→public→booking→CRM→future payment.
2. Подтверди draft recovery, unique slug, media ownership и запрет data URL.
3. Публикация только через server readiness и moderation; повторная pending/rejected версия не снимает последний approved snapshot.
4. Проверь tour/excursion product_type во всех каталогах, API, поиске, карте и аналитике.
5. Проверь capacity/overbooking/waitlist concurrency и server price snapshot.
6. Бронирование должно появляться у туриста, организатора и администратора с согласованными статусами.
7. Добавь notifications/outbox и audit trail moderation.
8. Проведи mobile editor QA и понятные empty/error states.
9. Проверь два browser context для autosave conflict и две учётные записи организатора для owner/BOLA negative cases.
10. Зафиксируй DB assertions до и после approve/reject/re-moderation и 0 orphan rows/storage objects после cleanup.

Проверки: staging DB fixtures для tourist/organizer/admin, concurrency tests, audit:quick, rls-audit, supabase:verify, Playwright journeys. Очисти только созданные тестовые данные. Финал: evidence matrix и «Синхронизация проекта».
```

## Sprint 8. Контент, CMS и редакционная фабрика

### Цель

Перевести контент из большого импорта в управляемый, проверяемый и регулярно обновляемый продукт.

### Объём

- Source registry и sensitive-content workflow.
- Тематические пакеты, а не массовая генерация.
- Top-50 pages по search intent/conversion.
- Places CMS cutover пакетами.
- Media completeness и freshness dates.
- Автор, reviewer, status, verification due.

### Готовый промпт

```text
Ты — ведущий редактор и CMS-инженер RU-first проекта «Пора в Аргентину».

Выполни Sprint 8 по docs/audit/full-project-readiness-roadmap-2026-07-15.md. Прочитай AGENTS.md, editorial-standard.mdc, docs/audit/content-seo-audit-2026-07-15.md, content audit JSON, CMS architecture и knowledge-base README.

Можно создать до 3 подагентов: (1) content inventory/priority, (2) official-source research для одного тематического пакета, (3) CMS/media/links QA. Исследователь обязан использовать актуальные первичные/официальные источники. Ведущий редактор принимает факты и формулировки.

Не пытайся переписать все 689 записей. Выбери один пакет top-20/top-50 по намерению и пользе. Не публикуй визы, деньги, безопасность, медицину и документы без источников и даты проверки.

Сделай:
1. Приоритизируй страницы: traffic/conversion/internal linking/freshness/risk.
2. Для пакета создай source registry, reviewer, verified_at, verification_due.
3. Исправь русский title/summary, thin content, hero и перелинковку только на основе проверенных фактов.
4. Убери orphan pages через осмысленные хабы; не создавай SEO-спам.
5. Проведи places CMS cutover только для полностью готового тематического набора с rollback.
6. Добавь publication quality gate и редакторский отчёт.

Проверки: content:lint, broken links, duplicates, media integrity, CMS readiness, SEO crawl выбранного пакета, audit:quick. Финал: список опубликовано/карантин/нужен эксперт и «Синхронизация проекта».
```

## Sprint 9. Платежи, возвраты и compliance

### Цель

Подготовить финансовый контур к sandbox-пилоту без фиктивных успешных состояний.

### Объём

- Provider decision: Stripe/Mercado Pago/manual link.
- Sandbox checkout/webhook/retry/refund/reconciliation.
- Idempotency и immutable ledger.
- Legal copy, receipts/taxes, organizer settlement.
- Privacy export/delete, retention и incident response.

### Готовый промпт

```text
Ты — ведущий payments/compliance инженер проекта «Пора в Аргентину».

Выполни Sprint 9 по docs/audit/full-project-readiness-roadmap-2026-07-15.md. Прочитай AGENTS.md, global-system-approach, payments-stripe-e66.md, refunds-e82.md, compliance-e80.md, GDPR docs, payment migrations и capability matrix.

Можно создать до 3 подагентов: (1) Stripe sandbox, (2) Mercado Pago/refunds/reconciliation, (3) compliance/legal data-flow audit. Только ведущий меняет общую state machine и ledger.

Не включай production payment, не делай реальные списания и не меняй provider secrets. Код не должен показывать paid/refunded без подтверждённого webhook/provider response.

Сделай:
1. Определи применимый provider и capability per offer.
2. Проверь checkout, signed webhook, replay/idempotency, partial/full refund, failure и timeout.
3. Сохраняй immutable transaction/audit trail и reconcile provider vs booking.
4. Подготовь organizer payout/commission model без фиктивных выплат.
5. Согласуй legal copy, чек/налог/договор/возврат SLA как ручные решения владельца.
6. Проверь privacy export/delete и retention финансовых данных.
7. Добавь runbooks dispute, webhook outage, duplicate charge и key rotation.

Проверки: sandbox-only E2E, webhook replay, concurrency, audit:security, audit:quick, DB fixtures и cleanup. Финал: GO/NO-GO по каждому provider и «Синхронизация проекта».
```

## Sprint 10. Доступность, браузеры и системная UI-приёмка

### Цель

Сделать WCAG AA и cross-browser проверку блокирующей частью релиза.

### Объём

- Playwright Chromium + Firefox + WebKit.
- axe-core critical journeys.
- Keyboard, focus, dialogs, combobox, live regions.
- Zoom 200%, 320/390/768/1440.
- Reduced motion, contrast, touch targets.
- Устранение accessibility/hook warnings, которые влияют на поведение.

### Готовый промпт

```text
Ты — ведущий accessibility и cross-browser QA-инженер проекта «Пора в Аргентину».

Выполни Sprint 10 по docs/audit/full-project-readiness-roadmap-2026-07-15.md. Прочитай AGENTS.md, editorial-standard, accessibility-e52.md, component-library-e50.md, свежие UX-аудиты и все Playwright configs.

Можно создать до 3 подагентов: (1) public tourist journeys, (2) auth/profile/organizer/admin, (3) component primitives/modals/forms. Подагенты сначала делают read-only findings; ведущий распределяет непересекающиеся исправления.

Сделай:
1. Добавь Firefox и WebKit projects, сохрани Chromium.
2. Подключи axe для home/catalog/detail/auth/booking/profile/organizer/admin; serious/critical блокируют CI.
3. Проверь keyboard-only, focus return/trap, Escape, combobox, error summary, live status.
4. Проверь zoom 200%, 320/390/768/1440, orientation и safe-area.
5. Проверь reduced-motion и контраст всех palette presets.
6. Исправь ARIA/alt и опасные React hook warnings, не маскируя правила eslint-disable.
7. Создай visual baseline с осмысленной процедурой обновления.
8. Исправь подтверждённые текущим аудитом проблемы: mobile login через меню, stale tour fixture, ожидание auth dialog без `.first()` по общему тексту, overflow detector для намеренно scrollable carousels/tables и двойной подсчёт UX reporter.

Проверки: все 3 браузера, axe, stage2 visual 42/42, UX audit без unexpected fail/skip, audit:quick. Финал: матрица browser×journey×viewport, точные counts и только доказанные исключения, «Синхронизация проекта».
```

## Sprint 11. Архитектура, API-контракты и platform upgrade

### Цель

Снизить стоимость дальнейшей разработки и подготовить безопасный Next.js upgrade.

### Объём

- ADR Supabase vs Prisma dual layer.
- OpenAPI/API registry и shared validators.
- Server/client boundary reduction.
- Caching/rendering matrix.
- ESLint CLI, Node 22 parity.
- План Next.js 16, proxy migration и breaking changes отдельным PR.

### Готовый промпт

```text
Ты — ведущий архитектор Next.js платформы «Пора в Аргентину».

Выполни Sprint 11 по docs/audit/full-project-readiness-roadmap-2026-07-15.md. Используй skill nextjs, прочитай его полностью, AGENTS.md, docs/ai-first/ARCHITECTURE.md/DECISIONS.md, package.json, next.config.ts, middleware.ts, Prisma/Supabase repositories и API inventory.

Можно создать до 3 подагентов: (1) API/domain boundaries, (2) rendering/cache/client bundle, (3) dependency/Next upgrade compatibility. Подагенты не выполняют массовые codemod одновременно.

Сделай:
1. Зафиксируй target architecture и ownership по доменам.
2. Прими ADR по Prisma: оставить с чёткой ролью или поэтапно вывести; Supabase остаётся source of truth.
3. Создай API registry/OpenAPI для public и partner-facing routes; общие auth/validation/error contracts.
4. Уменьши дубли Route Handlers и client components там, где Server Components/Actions дают пользу без риска.
5. Определи SSG/ISR/SSR/cache/no-store стратегию по типам данных.
6. Переведи next lint на ESLint CLI, закрепи Node 22 и dependency policy.
7. Подготовь и выполни Next.js 16 upgrade только отдельным минимальным набором: proxy, async APIs, config, React compatibility, security. Не смешивай с feature work.

Проверки: audit:quick, build, release:gate, bundle/perf diff, auth regression, dependency audit. Финал: ADR, deprecation plan и «Синхронизация проекта».
```

## Sprint 12. i18n, поиск и контролируемый рост

### Цель

Расширять продукт только после доказанной готовности RU-core и измеримых результатов.

### Условия старта

- Performance budgets проходят.
- Analytics funnel работает минимум 4 недели.
- SEO RU crawl чистый.
- Booking success/fallback измеряются.
- Контентная команда способна поддерживать freshness.

### Объём

- Решение: какие локали имеют реальную бизнес-ценность.
- Locale-aware publication registry, translations, canonical/hreflang.
- Search relevance/zero results.
- Growth experiments с guardrails.
- PWA/forum/AI features — только через evidence gate.

### Готовый промпт

```text
Ты — ведущий product growth и i18n-инженер проекта «Пора в Аргентину».

Выполни Sprint 12 по docs/audit/full-project-readiness-roadmap-2026-07-15.md только если Sprint 0–6 завершены и доступны 4 недели достоверной аналитики. Прочитай AGENTS.md, editorial-standard, i18n-e39.md, i18n-workflow-e93.md, cms-i18n-rollout-e77.md, search docs и текущий KPI readout.

Можно создать до 3 подагентов: (1) market/locale evidence, (2) i18n technical registry, (3) search/growth experiment design. Не публикуй машинный fallback как готовый перевод.

Сделай:
1. На данных выбери максимум одну следующую локаль или обоснуй отказ.
2. Создай locale-aware publication registry: translated, reviewed, indexable, canonical, hreflang reciprocal.
3. Переводи только приоритетные landing/funnel/legal страницы с human review.
4. Улучши search relevance, zero-results и analytics; не добавляй отдельный Meilisearch без измеримой необходимости.
5. Для каждого эксперимента определи hypothesis, primary metric, guardrail, sample, stop rule.
6. PWA/forum/AI развивай только если они улучшают core KPI и не ухудшают performance/privacy.

Проверки: locale crawl, hreflang reciprocity, content review, analytics experiment QA, audit:quick, performance regression. Финал: ship/hold decision и «Синхронизация проекта».
```

## 7. Рекомендуемая организация агентов

Для каждого спринта использовать модель:

1. **Lead agent** — владеет планом, общей архитектурой, интеграцией и финальной проверкой.
2. **Audit subagent** — только read-only evidence и список находок.
3. **Implementation subagent** — один ограниченный, непересекающийся участок.
4. **Verification subagent** — тесты, браузеры, SQL/advisors или документация.

Правила параллельной работы:

- не более трёх подагентов одновременно;
- один файл/общая абстракция — один владелец;
- миграции, общие типы, capability resolver и release config меняет lead;
- findings сначала подтверждаются кодом/тестом, затем исправляются;
- подагенты не делают commit/push/deploy;
- lead повторно читает итоговый diff и запускает общий gate.

## 8. Что делать прямо сейчас

Первым запускать **Sprint 0**, затем **Sprint 0A**, затем **Sprint 1**. Не начинать новую публичную функцию до их завершения.

Короткая последовательность ближайших действий владельца:

1. Сохранить текущее состояние отдельной безопасной веткой/резервной копией по своему git-процессу.
2. Передать агенту промпт Sprint 0.
3. После чистого кандидата создать изолированные preview + staging Supabase, test accounts, disposable mailbox и payment sandbox.
4. Передать агенту промпт Sprint 0A и получить 25 L4 journeys без failed/skip/orphans.
5. Передать агенту Sprint 1 с подключённым именно staging Supabase MCP.
6. Только после зелёных staging gates принимать решение о production deploy.

## 9. Финальное определение полной готовности проекта

Проект можно считать профессионально готовым к устойчивой эксплуатации, когда одновременно выполнено:

- один воспроизводимый SHA проходит CI, staging и production smoke;
- schema/migration ID подтверждён БД, а не только файлом;
- 0 P0/P1 security и SEO;
- Core Web Vitals в бюджете на ключевых шаблонах;
- Chromium/Firefox/WebKit и axe зелёные;
- аналитика и consent доказаны в live;
- partner/native capability честно отображается во всех интерфейсах;
- все 25 критичных journeys из раздела 3.16 имеют L4 evidence и воспроизводятся одной командой на staging;
- acceptance suite не содержит stale fixtures, неожиданных skip, timing false positives и двойного подсчёта;
- backup/restore и incident response отрепетированы;
- контент имеет источник, автора, дату проверки и publication status;
- платежи включены только при подтверждённом provider/legal/ops контуре;
- новые функции принимаются по данным core funnel, а не по наличию идеи.
