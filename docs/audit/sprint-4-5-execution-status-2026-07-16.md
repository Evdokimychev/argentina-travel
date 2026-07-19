# Sprint 4–5 — статус выполнения и дальнейшая последовательность

Дата: 16 июля 2026 года  
Ветка: `codex/sprint-0-release-candidate`  
Статус: локальный технический пакет готов; commit, push, deploy и действия во внешних кабинетах не выполнялись.

## Итог

| Направление | Локальный результат | Статус закрытия |
|---|---|---|
| Sprint 4 — technical SEO | Production-preview crawl прошёл 576/576 sitemap URL; 0 critical, 0 warnings, 0 hreflang issues, 0 duplicate metadata | Локальный quality gate пройден; operational exit ждёт deploy, production crawl и GSC/Bing |
| Sprint 5 — analytics/consent/KPI | Event contract v3, PII sanitizer, fail-closed consent и честная admin funnel реализованы; 49 профильных тестов зелёные | Кодовый инкремент готов; production analytics, trusted ingestion и staging E2E заблокированы внешней настройкой и migration history |
| Общий кандидат Sprint 0–7 | `audit:quick` и production build зелёные | Интеграция компилируется и проходит unit/integration gate; L4 acceptance всё ещё требует отдельного staging |

## Sprint 4 — что сделано

- Добавлен единый финальный RU publication gate для sitemap.
- Fallback `/en` и `/es`, приватные, транзакционные, поисковые и нестабильные partner URL не публикуются.
- Технические city aliases и подтверждённые дубли имеют явное решение redirect/withheld/noindex.
- Partner guide IDs не попадают в sitemap, пока detail source не гарантирует существование страницы.
- Зафиксированы решения по 56 кластерам `/places` ↔ `/baza-znaniy`.
- После интеграции всех параллельных изменений production-preview sitemap содержит 576 URL.

### Доказательства Sprint 4

- `src/lib/seo/publication-registry.ts` и контрактные тесты.
- `docs/audit/sprint-4-url-decision-ledger-2026-07-16.md`.
- `var/ops/seo-audit-sprint-4-5-candidate.json`:
  - `ok=true`;
  - 576/576 URL проверены;
  - 0 critical issues;
  - 0 warnings;
  - 0 hreflang issues;
  - 0 duplicate metadata.

### Что не позволяет назвать Sprint 4 полностью закрытым

1. Production deploy и повторный crawl не выполнялись.
2. Sitemap не отправлен в GSC/Bing, статусы внешних кабинетов не подтверждены.
3. Publication registry уже является последним sitemap gate, но route metadata и redirects ещё не полностью генерируются из одного реестра. Текущий результат согласован crawl-тестом, однако строгий архитектурный exit criterion остаётся отдельной задачей.

## Sprint 5 — что сделано

- Общий envelope v3: `event_id`, `session_id`, `occurred_at`, `product_id`, `product_type`, `booking_mode`, `outcome`.
- Analytics payload принимает только плоские scalar-поля, очищает URL и блокирует PII/contact payload.
- Нормализованы `native_success`, `partner_redirect`, `fallback` и явный `error`; platform/native/internal не считаются внешним партнёром.
- Payload не может подменить имя события или системные ID.
- До consent события не отправляются; revoke сначала переводит Consent Mode в denied, затем прекращает новые app events и останавливает Метрику.
- Приложение не создаёт собственный `page_view`, чтобы не конкурировать с единственным владельцем pageview в GA4.
- Серверный writer использует тот же PII-free контракт.
- Admin funnel больше не подставляет bookings/inquiries вместо просмотров. При недоверенном источнике проценты скрыты и показано «нет достоверных данных»; фактические booking cohorts остаются доступны отдельно.
- Подготовлены event dictionary, KPI framework, dashboard schema и weekly ops runbook.

### Доказательства Sprint 5

- Профильный набор Sprint 4/5: 13 файлов, 49/49 тестов.
- `npm run gtm-events:audit`: 19 событий, все покрыты документацией и trigger regex.
- `docs/analytics/event-dictionary-sprint-5.md`.
- `docs/analytics/kpi-framework-sprint-5.md`.
- `docs/analytics/dashboard-and-ops-runbook-sprint-5.md`.

### Что не позволяет назвать Sprint 5 полностью закрытым

1. Production readiness: 3 OK, 7 warnings, 6 failures, 4 skips. Не заданы/не подтверждены GTM, GA4, Метрика, Clarity и verification tokens.
2. `analytics_events` нельзя использовать как trusted KPI source: текущие grants/policy позволяют прямой INSERT ролям anon/authenticated. Нужна rehearsed migration после нормализации migration history.
3. Production baseline отсутствует: в таблице была одна строка `assistant_ask`, без `tour_view` и `booking_started`; продуктовые conversion targets пока статистически не обоснованы.
4. Нет staging evidence для native/partner/fallback/error и network-level consent/revoke.
5. GTM publish, Tag Assistant, GA4 DebugView, GSC/Bing/Ahrefs требуют доступа владельца.

## Общий интеграционный gate

- `npm run audit:quick`: PASS.
- TypeScript: PASS.
- ESLint: PASS с существующими warnings, без errors.
- Vitest: 231/231 test files, 1152/1152 tests.
- Production build с `NEXT_PUBLIC_ENABLE_DEMO_SEED=false`: PASS, 878 страниц.
- Full production-preview SEO crawl: PASS, 576/576.

Во время первого общего запуска были обнаружены три устаревших regression assertions: старый набор Lighthouse URL, старое hero crop и жёстко вшитый текст CTA. Проверки обновлены под действующие контракты: четыре blocking Lighthouse route с тремя прогонами, актуальное mobile crop и capability-driven CTA. После этого полный gate прошёл.

Оставшиеся build warnings: миграция Sentry server/edge init в instrumentation, использование `process.version` Supabase client в Edge trace и существующий lint backlog. Они не блокируют текущую сборку, но должны остаться в Sprint 2/10/11 backlog.

## Следующая последовательность спринтов

### Release prerequisites — до функционального расширения

1. Закрыть Sprint 0A на изолированном staging: 25 L4 journeys, negative access, cleanup 0 orphan.
2. Закрыть Sprint 1 infra exit: migration history, live RLS/grants/functions, trusted analytics ingestion migration.
3. Довести Sprint 2: durable cron storage, Sentry evidence, backup/restore rehearsal, SLO/alerts.
4. Довести Sprint 3: три холодных Lighthouse-прогона четырёх blocking routes и зафиксированный before/after.
5. Выполнить operational exit Sprint 4/5: deploy candidate, production crawl, search-console submit, analytics publish/debug evidence.
6. Выполнить staging L4 для уже реализованного source-пакета Sprint 6/7: booking, handoff, concurrency, moderation, inventory и cleanup.

### Sprint 8 — контент, CMS и редакционная фабрика

Приоритет: начать после стабилизации публикационного реестра. Работать тематическими пакетами, начиная с top-50 страниц по search intent/conversion. Каждый материал получает source, author, reviewer, verified/freshness status; чувствительный контент без первичного источника остаётся в quarantine. Places CMS cutover — только пакетами с rollback.

### Sprint 9 — платежи, возвраты и compliance

Приоритет: только после staging и юридического решения по provider. Отдельный GO/NO-GO для Stripe/Mercado Pago/manual link; sandbox checkout/webhook/replay/refund/reconciliation; immutable ledger, privacy/retention и incident runbooks. Production payments не включать без legal/ops owner.

### Sprint 10 — доступность, браузеры и UI acceptance

Приоритет: параллельно с контентом после стабильной сборки. Chromium/Firefox/WebKit, 320/390/768/1440, zoom 200%, axe, keyboard/focus/dialog/live regions. Закрыть существующие hook/a11y warnings, которые влияют на поведение.

### Sprint 11 — архитектура, API-контракты и platform upgrade

Приоритет: после feature freeze. ADR Supabase/Prisma, API registry, shared validators, server/client boundaries, caching matrix, ESLint CLI и Node 22 parity. Next.js 16 upgrade — отдельным PR с bundle/performance diff и rollback.

### Sprint 12 — i18n, поиск и контролируемый рост

Приоритет: только после четырёх недель доверенной аналитики. Решение по локалям принимать по данным; каждая индексируемая локаль требует человеческого перевода, self-canonical и reciprocal hreflang. Search experiments обязаны иметь hypothesis, metric, guardrail и stop rule.

Готовые копируемые промпты для Sprint 8–12 находятся в соответствующих разделах `docs/audit/full-project-readiness-roadmap-2026-07-15.md`.

## Синхронизация проекта

- Sprint 4/5 совместимы с параллельными Sprint 2/3/6/7: общий audit и build зелёные.
- Никаких production writes, реальных partner orders, писем или оплат не выполнялось.
- Commit/push/deploy не выполнялись: для них требуется отдельное явное разрешение по правилам репозитория.
