# PROJECT_STATE — GoArgentina / «Пора в Аргентину»

Последняя проверка: **2026-07-29 05:19 ART / 2026-07-29 08:19 UTC**
Статус: **NOT READY**
Фаза: **Wave 1 P0/P1 recovery**

## Конституция

Master Goal V6 принят как главный норматив проекта. Контрольная сумма и источник зафиксированы в `CONSTITUTION.md`.

## Git и candidate state

- Чистая ветка: `codex/master-goal-release-candidate`, base `origin/main` `8d7eec67ad8e9c3eb285fed2fdc39a501838b692`.
- Product candidate SHA до этой записи: `34c05f550f146ea0de50e10127693b027f4f7fb0`; `origin/main` является ancestor.
- Все шесть доказанных пакетов перенесены последовательно без конфликтов: `41dac6d0`, `20f6b2d4`, `c4f97bda`, `a90f1c11`, `78c8446c`, `a07327db`.
- Пользовательские 24 dirty entries остались только в исходном worktree и не попали в release candidate.
- Последний runtime-product SHA: `34c05f550f146ea0de50e10127693b027f4f7fb0` (`fix: preserve privacy terminal state`).

## Production и deployments

- Канонический URL: `https://www.goargentina.ru`; production SHA по health: `993e82fb7a6d59b47260387856acce68bb52b651`.
- Vercel project ID: `prj_Xjbr4awgjc56swIgwUEmybVd69PP`; team ID: `team_yWNX34oFl2Yk6lrllqiulis0`.
- `efd7f30a` собран Vercel успешно: deployment `2P6Pnq4T1dY1kbn4VQQ8ksAKVu6R`.
- `4c209069` собран Vercel успешно: deployment `D9WetK9zSgNuom1ytiAUYmmLfsne`.
- `ef447d8e`: deployment **не создан**; GitHub/Vercel status `failure`, точная причина `Account is blocked` (2026-07-29 04:17 UTC).
- Чистый candidate `a07327db`: deployment **не создан**; Vercel немедленно вернул `failure: Account is blocked` (2026-07-29 04:30 UTC).
- `b53daadd`: deployment **не создан**; Vercel снова вернул `failure: Account is blocked` (2026-07-29 04:51 UTC).
- `0759b597` был отклонён с `Account is blocked`; exact code SHA `189684fa` после восстановления build-доступа успешно развернут как deployment `NnmUYR17cEok1QXihkGjpMEgCqQA` (2026-07-29 05:28 UTC).
- Immutable branch preview: `https://argentina-travel-git-codex-master-goal-rele-451556-go-argentina.vercel.app`; health связывает его с полным code SHA `189684fa70d0bf020dcb7e835c29a38b5eca19ed`.
- Governance SHA `6f561171` успешно развёрнут как `9cogBLxxKgovByKTxfZ5UDmc7i92`.
- Exact WP-005 SHA `91be7962` сначала получил GitHub/Vercel `failure: Account is blocked` в 06:39 UTC, но в 06:48 UTC status сменился на success и был создан deployment `6Y9E1pGV4DD85N5U9JzqztLadTEc`. Это доказывает восстановленный build path, но также его нестабильность.
- Immutable branch preview теперь сообщает полный SHA `91be7962cd5bdcb5609c31dde785382c8f3943eb`. Vercel dashboard/CLI runtime-log scope всё ещё недоступен, поэтому runtime-логи не считаются проверенными.
- Exact WP-006 SHA `d07f48c8` получил `failure: Account is blocked` в 07:19 UTC, затем в 07:28 UTC сменился на success и развернулся как deployment `8QR63FhdmjYAfbgQiKPx8vQ9DgnM`. Повторный девятиминутный recovery подтверждает волатильность account state.
- Exact WP-007 SHA `cad6aa35` получил `failure: Account is blocked` в 07:38 UTC, затем success в 07:50 UTC и deployment `ApSwUC4F1qfgwMAjkKqRELUSojuY`.
- Exact WP-008 SHA `e4c1dad5` получил `failure: Account is blocked` в 07:49 UTC, затем success в 07:58 UTC и deployment `B3yBJSTtcerPqeYJwKpWwR3vxj3T`.
- Exact WP-009 SHA `34c05f55` успешно развернут как deployment `CKfpUHhxpSzqgQUuhXQuidrC7HGh` в 08:14 UTC.
- Production `/api/health`, `/public`, `/database`, `/partners` остаются 503/down. Production promotion не выполнялся.

## Supabase, migrations, CMS и recovery

- Канонический production ref: `uooxrypocahomoqzdvzy`; подключённый MCP не имеет к нему доступа.
- REST root cause подтверждён точным ответом `exceed_egress_quota`.
- Локальный production runtime при тех же project settings видит direct Postgres (`tripsterCount=68`), тогда как deployed production direct PG недоступен: это отдельная Vercel runtime/env/connectivity ветка P0.
- Local tree: 107 SQL migrations; live journal/checksum/RLS/grants не подтверждены. Новые DDL не создавались и не применялись.
- Managed backup/PITR и disposable restore rehearsal не подтверждены.
- CMS source-of-truth и operational writes нельзя считать доказанными до восстановления canonical DB и reconciliation.

## Реализовано

### WP-001 — fail-closed catalogs

- Operational failure больше не превращается в `200 []`/ложный `404`: unavailable → 503/LKG; empty/missing выдаются только после подтверждённого чтения.
- `/api/tours` на outage → 503 + `Retry-After: 60`; `/api/excursions` при доступных партнёрах → 200 partial, при total outage → 503.
- UI tours/excursions не показывает ложный zero/empty; tour LKG имеет TTL 5 минут и не отравляется ошибкой.
- Release/readiness отчёты привязываются только к healthy HTTP 200 health с совпадающим SHA.

### WP-002 — product truth

- Footer, hero, about, navigation, marketplace value props и guide copy больше не называют весь продукт доказанным marketplace и не обещают глобально проверенных организаторов, реальные отзывы или отсутствие предоплаты.
- Copy различает внутреннюю заявку GoArgentina и партнёрский checkout/status/payment/cancellation.
- Контрактный тест сканирует четыре локали и наиболее рискованные public-copy sources.

### WP-003 — editorial guide critical path

- Editorial-only pillar guides больше не загружают marketplace и не резолвят detail каждой карточки до SSR.
- Content schema проверяется на реальный `tour-embed`; только такой виджет сохраняет прежний catalog + public-detail validation path.
- Marketplace modules подключаются динамически только после положительного schema check; operational catalog failures не кешируются как empty.

### WP-004 — optional guide widget boundary

- Погодный guide больше не ждёт каталог на уровне route: promise передаётся в локальный `Suspense`, поэтому editorial stream и H1 доступны во время загрузки виджета.
- Полный operational failure detail-resolver больше не схлопывается в подтверждённый empty: optional embed получает typed `unavailable`; подтверждённое отсутствие остаётся `ok + []`.
- При частично доступном каталоге без подходящих карточек виджет безопасно не показывается; основной материал остаётся полным, без глобального error UI и horizontal overflow.

### WP-005 — reproducible product surface inventory

- Текущая поверхность генерируется из AST и графа импортов, а не копируется из исторического ручного CSV: 157 страниц, 312 route handlers, 1 metadata route и 1 middleware matcher.
- Созданы канонические `docs/audit/architecture-current.md`, `route-inventory.csv`, `route-component-data-matrix.csv` и `interaction-inventory.csv`; исторический `docs/release-2026-07/` сохранён как baseline.
- Матрица содержит 470 route/data строк, interaction ledger — 2 298 уникальных source-bound строк с line/column; CSV-ширина, ID и ссылки на исходные строки проверены.
- `inventory:check` включён в `audit:quick` и blocking static release gate. Статические сигналы не выдаются за live-схему, RLS, backend effect или тестовое покрытие.

### WP-006 — critical interaction evidence

- Создан проверяемый manifest для 11 критических P0/P1 journey: UI → достижимый client request → HTTP method/endpoint → exported route handler → effects/guards/invariants → отдельные evidence layers.
- Template URL теперь нормализуются без исполнения кода (`/api/bookings/[bookingId]/…`), а не теряются как `dynamic`; generator проверяет UI-якорь, dependency path, метод, handler export, source interaction, test-файл и точное имя теста.
- Booking create, Mercado Pago, Stripe, tourist/organizer refund, admin refund preparation, payout, shop order и organizer application связаны с unit contracts. Privacy export, delete request и admin transition остаются `source_only`.
- Все 11 production effects имеют статус `unknown_db_down`; unit contract не объявлен route integration, browser effect или live persistence proof.

### WP-007 — privacy route integrity

- Privacy export route доказывает: без session user payload не собирается; с session user builder получает именно текущий server client/user, response — attachment.
- Delete-request route доказывает: admin self-delete блокируется, активная заявка возвращается как 409, reason ограничен 2 000 символами, user identity/metadata берутся из session server-side.
- Admin transition теперь запрещает approve/reject для `approved`/`processing`, применяет `.eq(id).eq(previous status)` и при проигранной гонке возвращает 409 до audit side effect.
- Approval больше не выставляет `profiles.deleted_at`: auth/profile/data mutation выполняет только deletion processor после собственного atomic claim `approved → processing`. Actor/approval metadata сохраняются в том же update privacy request; отдельный admin audit остаётся best-effort.
- Новые DDL/RPC не создавались: concurrent duplicate prevention, durable audit и live cron effect отложены до canonical migration parity.

### WP-008 — privacy retry identity preservation

- Root cause: processor заново читал email только из `profiles`; если предыдущая попытка уже анонимизировала профиль, но упала до email-linked cleanup/completion, retry терял исходный email и не мог гарантированно дочистить связанные записи/outbox.
- Processor теперь предпочитает текущую profile identity до анонимизации, а при уже пустом email восстанавливает исходные email/fullName из metadata самой privacy request. Эти PII удаляются из metadata при terminal completion существующим `completedDeleteMetadata`.
- Unit tests доказывают partial-anonymization fallback, normal pre-anonymization branch и PII-free completed metadata. Полная multi-system transactionality, duplicate-request uniqueness и live effect не заявляются.

### WP-009 — privacy terminal-state monotonicity

- Root cause: completion email выполнялся внутри общего destructive `try/catch`; его исключение после успешного `status=completed` запускало ID-only update в `failed`, создавая логический rollback уже выполненного удаления.
- Terminal updates теперь CAS-ограничены текущим `status=processing`. Потерянный CAS не затирает новый статус; completion notification выполняется после terminal commit и является best-effort.
- Автоматическое чтение `failed` cron-очередью не включено: безопасный retry остаётся явным `failed → approved` через admin route до появления DB-backed lease/backoff/dead-letter и доказанной schema parity.

## Проверки candidate

- Текущий `npm run audit:quick`: TypeScript + ESLint + inventory stale-check + **427 files / 2 019 tests** + **8 release-evidence tests** — pass.
- Focused product-truth: **15 tests** — pass.
- Защищённый production build точного `ef447d8e`: exit 0, **930/930**, demo auth markers absent; health bundle сообщает полный SHA `ef447d8e0c7f722f68099b2cc76b733c5fd88be1`.
- Local production-equivalent smoke: `/api/health` 503 degraded с exact SHA, `/api/tours` 503 + `Retry-After: 60`, `/api/excursions` 200 partial с 59 total и `unavailableSources=[platform]`; `/`, `/about`, booking guide и safety guide — 200.
- Browser QA свежего bundle: 1440×900 и 390×844, unsupported claims absent, horizontal overflow 0. `/guide/bezopasnost` имеет холодный SSR 7.9–8.6 s — отдельный performance-риск, не функциональный false-loader.
- Production dependencies: `npm audit --omit=dev` — 0; dev toolchain — 9 high.
- Финальная production перепроверка 2026-07-29 04:24 UTC: health/public/database/partners — 503; tours/excursions по-прежнему возвращают ложный 200 empty на старом SHA `993e82fb`.
- Clean-candidate verification: lockfile install dry-run + install pass; 46 focused Vitest + 8 Node evidence tests pass; Prisma generate, TypeScript and lint pass (existing warnings only).
- Clean-candidate protected build at `9a5c40be49146252c54015ecd2b4cdbfde544499`: exit 0, **929/929**, runtime-text audit pass, demo auth markers absent. Production-equivalent smoke with the existing local runtime environment: health 503 degraded with exact SHA and direct PG healthy (`tripsterCount=68`), tours 503 + `Retry-After: 60`, excursions 200 partial with 59 total and platform marked unavailable.
- WP-003 `audit:quick`: TypeScript + ESLint + **423 files / 1 999 tests** + **8 release-evidence tests** — pass; focused guide/latency suite **20/20** — pass.
- Protected production build exact `b53daadd`: exit 0, **929/929**, runtime-text audit pass, demo auth markers absent.
- Cold production-equivalent benchmark: `/guide/bezopasnost` **3.797 s → 0.399 s** (−89%); `/guide/yazyk` **2.545 s → 0.057 s** (−98%). Marketplace error logs appear only for `/guide/pogoda-i-sezonnost`, whose schema contains the sole `tour-embed`.
- Browser QA exact `b53daadd`, 1440×900 and 390×844: full safety content and FAQ contract rendered, no route error, loader absent, horizontal overflow 0.
- WP-004 `audit:quick`: TypeScript + ESLint + **423 files / 2 001 tests** + **8 release-evidence tests** — pass; focused fault/guide suite **10/10** — pass.
- Protected production build exact `189684fa`: exit 0, **929/929**, runtime-text audit pass, demo auth markers absent. Compile занял 44.0 min при параллельной Xcode/iOS-сборке; это зафиксированное ограничение локальной среды, не build failure.
- Production-equivalent runtime exact `189684fa`: weather **TTFB 0.480 s / total 2.902 s**, safety **0.059/0.083 s**, language **0.042/0.083 s**; health сообщает exact SHA, direct PG healthy (`tripsterCount=68`), REST degraded по quota.
- Browser QA exact `189684fa`: desktop weather на 1.153 s уже имеет H1/main + локальный `aria-busy` skeleton, без route error/overflow; после partial-source resolution parent остаётся полным. Mobile 390×844 и safety body (13 864 chars, FAQ heading) — без route error/overflow. Логи содержат quota/Tripster 429, но не uncaught RSC error.
- Immutable preview deployment `NnmUYR17cEok1QXihkGjpMEgCqQA`: health/public/database/partners — 503/down с exact SHA; tours/excursions — 503 + `Retry-After: 60`; weather main/H1 доступен, затем локальный unavailable widget видим на desktop/mobile; safety guide имеет полный FAQ/body, route error и horizontal overflow отсутствуют.
- Штатный `production-smoke` на preview завершился `exit 1` ровно на health gate (`ok` не true, direct PG down). Это корректный запрет promotion, а не функциональный smoke pass.
- WP-005 `audit:quick`: TypeScript + ESLint + inventory stale-check + **424 files / 2 005 tests** + **8 release-evidence tests** — pass; focused generator suite **4/4** — pass.
- CSV contracts: route **471×14**, route/data **470×15**, interactions **2 298×12**; ширина стабильна, ID уникальны, 2 298/2 298 source-line references валидны; snapshot digest `80ac3a65d5030d32`.
- Protected exact-SHA `91be7962` build: exit 0, 685 static pages generated, runtime-text audit pass, demo auth markers absent. Первый запуск без canonical site URL и первый SHA-binding запуск со stale Vercel SHA были отклонены и не засчитаны; финальная сборка явно связана с полным exact SHA без изменения `.env`.
- Local exact-SHA health/public/database/partners — 503/down; tours/excursions — 503 + `Retry-After: 60`; `production-smoke` exit 1 на mandatory health gate. Browser QA `/guide/bezopasnost`: desktop 1280 и mobile 390, H1/полный body, console errors 0, route error/overflow отсутствуют.
- Immutable preview `91be7962` / `6Y9E1pGV4DD85N5U9JzqztLadTEc`: health связывает полный SHA, health/public/database/partners и каталоги остаются fail-closed 503, remote desktop/mobile browser QA pass, штатный smoke exit 1. Deployment доказывает пакет и запрет promotion, но не production readiness.
- WP-006 `audit:quick`: TypeScript + ESLint + inventory stale-check + **424 files / 2 006 tests** + **8 release-evidence tests** — pass; focused generator suite **5/5** — pass.
- Generated evidence contracts: critical journeys **11×20**, unique IDs/source interactions; 8 `contract_tested`, 3 `source_only`; interaction inventory remains **2 298×12** and snapshot digest is `61da167bb0241da1`.
- Protected exact-SHA `d07f48c8` build: exit 0, **685/685** static pages, runtime-text audit pass, demo auth markers absent. Первый runtime start унаследовал stale глобальный Vercel SHA и был отклонён как evidence; повторный start явно сообщил полный `d07f48c85e2d33a5666ffc7513ffcf46190d9abc`.
- Local exact-SHA health/public/database/partners — 503/down; tours/excursions — 503 + `Retry-After: 60`; штатный `production-smoke` exit 1 на mandatory health gate. Browser QA `/join`: desktop 1280×900 и mobile 390×844, H1 и формы присутствуют, console errors/route error/overflow — 0.
- Immutable preview exact `d07f48c8` / deployment `8QR63FhdmjYAfbgQiKPx8vQ9DgnM`: health/public/database/partners и tours/excursions — 503/down, каталоги имеют `Retry-After: 60`, health связывает полный SHA. Remote `/join` desktop 1280 и mobile 390: H1/формы, console errors/route error/overflow — 0. Штатный smoke exit 1 ровно на health gate; promotion запрещён.
- Canonical production recheck 08:19 UTC: health/public/database/partners — 503/down на старом SHA `993e82fb`; tours/excursions всё ещё возвращают ложный 200 empty на outage. Candidate не продвигался.
- WP-007 focused privacy routes: **3 files / 8 tests** — pass. `audit:quick`: TypeScript + ESLint + inventory stale-check + **427 files / 2 014 tests** + **8 release-evidence tests** — pass.
- Critical evidence snapshot: **11×20**, source-only **0**, route-integration **3**, unit-contract **8**, digest `59baff56fe6c853d`; все production statuses остаются `unknown_db_down`.
- Protected exact-SHA `cad6aa35` build: exit 0, **685/685** static pages, runtime-text audit pass, demo auth markers absent. Local health сообщает полный exact SHA и 503/down; штатный smoke exit 1 на mandatory health gate.
- Local unauthenticated route/browser QA: `/profile/settings` и `/admin/operations/privacy-requests` → 307 sign-in; desktop 1280×900 и mobile 390×844 показывают один auth dialog, console errors/route error/overflow — 0. Action-кнопки не нажимались, POST/PATCH и реальное удаление не выполнялись.
- Immutable WP-007 preview `cad6aa35` / `ApSwUC4F1qfgwMAjkKqRELUSojuY`: health связывает полный SHA; health/public/database/partners и tours/excursions — 503/down, каталоги имеют `Retry-After: 60`; штатный smoke exit 1 на mandatory health gate. Remote unauthenticated `/profile/settings` desktop 1280×800 и mobile 390×844: один auth dialog, error boundary/overflow — 0. Реальные privacy actions не выполнялись.
- WP-008 focused privacy suite: **4 files / 11 tests** — pass. Critical snapshot остаётся **11×20**, source-only **0**, profile deletion journey теперь связывает route integration с partial-retry unit contract; digest `15416c50d6dc2e59`.
- Protected exact-SHA `e4c1dad5` build: exit 0, **685/685** static pages, runtime-text audit pass, demo auth markers absent. Local health сообщает полный exact SHA; health/public/database/partners и tours/excursions — 503/down. Штатный `production-smoke` exit 1 на mandatory health gate.
- Browser QA exact `e4c1dad5`: unauthenticated `/profile/settings` на desktop 1280×800 и mobile 390×844 редиректит на `/` и показывает ровно один auth dialog; error boundary и horizontal overflow — 0. POST/PATCH/cron/deletion не выполнялись.
- Initial Vercel status exact `e4c1dad5` был `failure: Account is blocked`; до последующего recovery более ранний deployment не использовался как evidence.
- Immutable WP-008 preview `e4c1dad5` / `B3yBJSTtcerPqeYJwKpWwR3vxj3T`: health связывает полный SHA; required health и каталоги — 503/down, штатный smoke exit 1. Remote `/profile/settings` desktop/mobile: один auth dialog, error boundary/overflow — 0. Backend deletion не выполнялся.
- WP-009 focused privacy suite: **4 files / 14 tests** — pass. `audit:quick`: TypeScript + ESLint + inventory stale-check + **427 files / 2 019 tests** + **8 release-evidence tests** — pass. Critical digest `2f2db7f6bcdc8127`.
- Protected exact-SHA `34c05f55` build: exit 0, **685/685** static pages, runtime-text audit pass, demo auth markers absent; compile завершился с существующими Edge/Sentry/cache warnings.
- Local/immutable preview exact `34c05f55` / `CKfpUHhxpSzqgQUuhXQuidrC7HGh`: health связывает полный SHA; health/public/database/partners и tours/excursions — 503/down, штатный smoke exit 1 на mandatory health gate. Desktop 1280×800 и mobile 390×844 `/profile/settings`: один auth dialog, error boundary/overflow — 0. Unauthenticated cron probe — 401; deletion не запускался.

## Открытые P0/P1

1. **P0-GA-001:** восстановить canonical Supabase REST и диагностировать deployed direct PG.
2. **P1-GA-004/006/007:** вернуть Supabase scope, доказать migration parity/RLS/grants и recoverability.
3. **P1-GA-005:** latest `34c05f55` развернут, но несколько предыдущих SHA восстанавливались только после 9–12 минут. Вернуть стабильный deploy path и read-only Vercel project/runtime-log scope.
4. **P1-GA-010:** production analytics/consent/conversion evidence остаётся непригодным до healthy deployment.
5. **P1-GA-012:** route evidence и CAS исправлены; DB-level unique active request, durable audit и live deletion processor effect не доказаны.
6. **P1-GA-013:** identity retry и terminal-state monotonicity исправлены; DB uniqueness, lease/recovery, durable audit и live multi-system effect остаются недоказанными.

## Следующие три задачи

1. Owner/ops: снять Supabase `exceed_egress_quota`; engineering: после восстановления выполнить health + migration/RLS/grants reconciliation и диагностировать direct-PG расхождение по Vercel logs/env names.
2. Owner/ops: вернуть read-only Vercel project/runtime-log scope; engineering: сопоставить env names/regions/connectivity для preview/prod direct PG без вывода или ротации секретов.
3. Engineering: выполнить WP-010 — fake-provider integration для booking/payment routes (token/state/replay/provider failure), без реального платежа; DB-level privacy unique/audit design оставить до parity.
