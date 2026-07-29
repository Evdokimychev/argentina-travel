# PROJECT_STATE — GoArgentina / «Пора в Аргентину»

Последняя проверка: **2026-07-29 04:04 ART / 2026-07-29 07:04 UTC**
Статус: **NOT READY**
Фаза: **Wave 1 P0/P1 recovery**

## Конституция

Master Goal V6 принят как главный норматив проекта. Контрольная сумма и источник зафиксированы в `CONSTITUTION.md`.

## Git и candidate state

- Чистая ветка: `codex/master-goal-release-candidate`, base `origin/main` `8d7eec67ad8e9c3eb285fed2fdc39a501838b692`.
- Product/governance candidate SHA до этой записи: `91be7962cd5bdcb5609c31dde785382c8f3943eb`; `origin/main` является ancestor.
- Все шесть доказанных пакетов перенесены последовательно без конфликтов: `41dac6d0`, `20f6b2d4`, `c4f97bda`, `a90f1c11`, `78c8446c`, `a07327db`.
- Пользовательские 24 dirty entries остались только в исходном worktree и не попали в release candidate.
- Последний code/tooling SHA: `91be7962cd5bdcb5609c31dde785382c8f3943eb` (`chore: generate current product surface inventory`); последний runtime-product SHA остаётся `189684fa70d0bf020dcb7e835c29a38b5eca19ed`.

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

## Проверки candidate

- `npm run audit:quick`: TypeScript + ESLint + **428 files / 2 058 tests** + **8 release-evidence tests** — pass.
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

## Открытые P0/P1

1. **P0-GA-001:** восстановить canonical Supabase REST и диагностировать deployed direct PG.
2. **P1-GA-004/006/007:** вернуть Supabase scope, доказать migration parity/RLS/grants и recoverability.
3. **P1-GA-005:** build/immutable preview восстановлены, но status для `91be7962` прошёл через transient `Account is blocked`; вернуть read-only Vercel project/runtime-log scope и диагностировать preview/prod direct-PG failure.
4. **P1-GA-010:** production analytics/consent/conversion evidence остаётся непригодным до healthy deployment.

## Следующие три задачи

1. Owner/ops: снять Supabase `exceed_egress_quota`; engineering: после восстановления выполнить health + migration/RLS/grants reconciliation и диагностировать direct-PG расхождение по Vercel logs/env names.
2. Owner/ops: вернуть read-only Vercel project/runtime-log scope; engineering: сопоставить env names/regions/connectivity для preview/prod direct PG без вывода или ротации секретов.
3. Engineering: на основе нового interaction ledger выделить критические booking/payment/profile/admin эффекты без явного evidence, добавить deterministic coverage manifest; полный card/detail/CTA crawl выполнить после восстановления data plane.
