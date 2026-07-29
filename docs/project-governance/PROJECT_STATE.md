# PROJECT_STATE — GoArgentina / «Пора в Аргентину»

Последняя проверка: **2026-07-29 01:24 ART / 2026-07-29 04:24 UTC**
Статус: **NOT READY**
Фаза: **Wave 1 P0/P1 recovery**

## Конституция

Master Goal V6 принят как главный норматив проекта. Контрольная сумма и источник зафиксированы в `CONSTITUTION.md`.

## Git и candidate state

- Активная ветка: `codex/master-goal-wave1-catalog-fail-closed`.
- Candidate HEAD: `ef447d8e0c7f722f68099b2cc76b733c5fd88be1`.
- WP-001 commits: `6927bf78` (catalog fail-closed), `efd7f30a` (healthy SHA-bound readiness evidence).
- WP-002 commits: `4c209069` (global product-truth copy), `ef447d8e` (remaining unsupported booking/verification claims).
- В рабочем дереве остаются 24 не относящихся к пакетам entries (23 tracked + 1 untracked); они не staged и не включены в candidate commits.
- Ветка содержит более раннюю feature-историю и пока не является чистым release branch от `main`; перед production promotion нужен controlled integration/cherry-pick.

## Production и deployments

- Канонический URL: `https://www.goargentina.ru`; production SHA по health: `993e82fb7a6d59b47260387856acce68bb52b651`.
- Vercel project ID: `prj_Xjbr4awgjc56swIgwUEmybVd69PP`; team ID: `team_yWNX34oFl2Yk6lrllqiulis0`.
- `efd7f30a` собран Vercel успешно: deployment `2P6Pnq4T1dY1kbn4VQQ8ksAKVu6R`.
- `4c209069` собран Vercel успешно: deployment `D9WetK9zSgNuom1ytiAUYmmLfsne`.
- `ef447d8e`: deployment **не создан**; GitHub/Vercel status `failure`, точная причина `Account is blocked` (2026-07-29 04:17 UTC).
- Immutable preview URL и runtime logs недоступны: Vercel MCP/API/CLI/Browser account scopes не дают доступ к проекту. Поэтому remote browser QA не считается выполненным.
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

## Проверки candidate

- `npm run audit:quick`: TypeScript + ESLint + **428 files / 2 058 tests** + **8 release-evidence tests** — pass.
- Focused product-truth: **15 tests** — pass.
- Защищённый production build точного `ef447d8e`: exit 0, **930/930**, demo auth markers absent; health bundle сообщает полный SHA `ef447d8e0c7f722f68099b2cc76b733c5fd88be1`.
- Local production-equivalent smoke: `/api/health` 503 degraded с exact SHA, `/api/tours` 503 + `Retry-After: 60`, `/api/excursions` 200 partial с 59 total и `unavailableSources=[platform]`; `/`, `/about`, booking guide и safety guide — 200.
- Browser QA свежего bundle: 1440×900 и 390×844, unsupported claims absent, horizontal overflow 0. `/guide/bezopasnost` имеет холодный SSR 7.9–8.6 s — отдельный performance-риск, не функциональный false-loader.
- Production dependencies: `npm audit --omit=dev` — 0; dev toolchain — 9 high.
- Финальная production перепроверка 2026-07-29 04:24 UTC: health/public/database/partners — 503; tours/excursions по-прежнему возвращают ложный 200 empty на старом SHA `993e82fb`.

## Открытые P0/P1

1. **P0-GA-001:** восстановить canonical Supabase REST и диагностировать deployed direct PG.
2. **P1-GA-004/006/007:** вернуть Supabase scope, доказать migration parity/RLS/grants и recoverability.
3. **P1-GA-005:** разблокировать Vercel account/project scope и получить remote immutable preview/log evidence.
4. **P1-GA-009:** перенести candidate commits на чистую release ancestry без пользовательских изменений.
5. **P1-GA-010:** production analytics/consent/conversion evidence остаётся непригодным до healthy deployment.

## Следующие три задачи

1. Owner/ops: снять Supabase `exceed_egress_quota`; engineering: после восстановления выполнить health + migration/RLS/grants reconciliation и диагностировать direct-PG расхождение по Vercel logs/env names.
2. Owner/ops: разблокировать Vercel account и read-only project scope; пересобрать `ef447d8e`, получить deployment ID, затем remote desktop/mobile/no-JS smoke.
3. Engineering: сформировать чистый release candidate из доказанных WP-001/WP-002 commits и выполнить полный card/detail/CTA crawl без production promotion до закрытия P0.
