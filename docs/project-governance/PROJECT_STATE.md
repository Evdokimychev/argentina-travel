# PROJECT_STATE — GoArgentina / «Пора в Аргентину»

Последняя проверка: **2026-07-29 00:16 ART / 2026-07-29 03:16 UTC**
Статус: **NOT READY**
Фаза: **Wave 0 baseline + Wave 1 P0/P1 recovery**

## Конституция

Master Goal V6 принят как главный норматив проекта. Контрольная сумма и источник зафиксированы в `CONSTITUTION.md`.

## Git и candidate state

- Активная ветка: `feat/blog-argentinian-steak-guide`.
- Локальный HEAD: `db4cd390a5563b0015f543d23a1619dd308cfc36`.
- `origin/main`: `8d7eec67ad8e9c3eb285fed2fdc39a501838b692`.
- Production SHA из `/api/health`: `993e82fb7a6d59b47260387856acce68bb52b651`.
- Рабочее дерево: 76 entries, 62 изменённых tracked-файла, 14 untracked-файлов; изменения принадлежат нескольким потокам и не образуют замороженный release candidate.
- WP-001 реализован и локально проверен; отдельные commit/preview/deployment ещё не созданы.

## Production

- Канонический URL: `https://www.goargentina.ru`.
- Apex `https://goargentina.ru` возвращает 308 на `www`.
- Vercel project: `argentina-travel`, project ID `prj_Xjbr4awgjc56swIgwUEmybVd69PP`, team ID `team_yWNX34oFl2Yk6lrllqiulis0`.
- Immutable deployment ID и `*.vercel.app` URL: **не подтверждены** — Vercel MCP OAuth отвечает 403 для scope `go-argentina`.
- `/api/health`, `/api/health/public`, `/api/health/database`, `/api/health/partners`: HTTP 503, `status=down`.
- Production REST и direct Postgres: `dependency_unavailable`; partner counts и last sync отсутствуют.
- Production-equivalent build получил от canonical REST точный ответ `exceed_egress_quota`. В локальном production runtime direct Postgres при этом отвечает успешно (`tripsterCount=68`), поэтому production direct-PG failure — отдельная проблема runtime environment/connectivity, требующая Vercel logs/env inspection.
- Build metadata сообщает migration `20260720230600_final_explicit_data_api_grants`, file count 107, но это не доказывает состояние live migration journal при недоступной БД.

## Supabase, CMS и данные

- Канонический production ref по baseline/docs: `uooxrypocahomoqzdvzy`.
- Подключённый Supabase MCP не имеет доступа к этому ref; доступные проекты не используются как proxy.
- Local tree: 107 SQL migrations. Baseline 2026-07-19 подтверждал 102; применение пяти более новых миграций в live journal независимо не проверено.
- CMS имеет новые native ingestion/control-plane документы и старое описание `DB override → TS fallback`; source-of-truth требует live reconciliation.
- Managed backup/PITR не подтверждены; encrypted logical backup требует owner secrets; restore rehearsal имеет статус `not_run`.

## Воспроизведённые P0/P1

1. **P0-GA-001:** production data plane down — все health endpoints 503, оба DB пути недоступны.
2. **P1-GA-001:** outage маскируется под business-empty: `/api/tours` → 200 `{"tours":[]}`, `/api/excursions` → 200 empty.
3. **P1-GA-002:** `/excursions` визуально сообщает «Экскурсий по этому запросу нет» во время инфраструктурного отказа; server snapshot кратко содержит «Загружаем страницу…».
4. **P1-GA-003:** mobile `/tours` показывает `0 туров найдено` до видимого error-state ниже fold.
5. **P1-GA-004:** footer продолжает называть продукт маркетплейсом и обещать проверенных организаторов без текущего end-to-end proof.
6. **P1-GA-005:** deployment/migration/backup evidence не замкнуты на текущий production artifact.

## WP-001 — локальный результат

- `/api/tours`: dependency outage → HTTP 503 + `Retry-After: 60`; confirmed empty → 200.
- `/api/excursions`: total outage → HTTP 503 + `Retry-After: 60`; available partner data + unavailable platform → 200 `catalogState=partial`, 59 items total.
- `/tours`: при доступных партнёрах 53 карточки; при искусственном total-outage используется свежий 5-минутный LKG, не `0`.
- `/excursions`: при total-outage route error показывает «Не удалось загрузить каталог экскурсий», retry и альтернативные переходы; false-empty отсутствует.
- Browser QA: 1440×900 и 390×844, horizontal overflow 0, console чиста на normal/partial path. На fault path виден ожидаемый Next route-error log, пользовательский текст не раскрывает backend details.
- Production build: exit 0, 930/930 static pages, demo auth markers отсутствуют. Первый build был ожидаемо остановлен safety-gate из-за локального demo flag; успешный build использовал одноразовый `NEXT_PUBLIC_ENABLE_DEMO_SEED=false`, `.env` не менялся.
- Clean install: `npm ci`; `npm audit --omit=dev` — 0. Dev toolchain — 9 high, без production dependencies.
- `npm run audit:quick`: TypeScript + ESLint + 427 test files / 2 049 tests + 8 release-evidence tests — pass.

Полный реестр: `ISSUE_LEDGER.csv`. Root-cause matrix: `ROOT_CAUSE_MATRIX.md`.

## Последние доказательства

- Live curl: health 503; tours/excursions API false-empty 200.
- Production browser baseline 1440×900: `/tours` показывал error block после `0 найдено`, `/excursions` — ложный empty-state.
- Local candidate browser QA 1440×900 и 390×844: real fallback/partial data отображаются без ложного zero; total-outage `/excursions` показывает error boundary; overflow отсутствует.
- Existing inventory: `docs/release-2026-07/route-inventory.csv` — 370 записей + header; текущий код содержит 157 pages и 311 route handlers, поэтому inventory требует regeneration.
- Production runtime dependencies: `npm audit --omit=dev` ранее подтверждён 0; dev-only advisory остаётся документированным.

## Блокеры

- Внешний P0: восстановление/диагностика production Supabase data plane требует доступа владельца к canonical project/billing/network/credentials.
- Supabase MCP: production ref отсутствует в текущем account scope.
- Vercel MCP: 403 scope; deployment ID, preview и runtime/build logs недоступны.
- Нельзя честно публиковать preview/production из смешанного dirty worktree без изоляции candidate.

## Следующие три задачи

1. Снять Vercel preview с изолированного WP-001 commit и привязать browser/smoke evidence к immutable deployment ID.
2. Владелец: снять `exceed_egress_quota`/spend cap на canonical Supabase; engineering: отдельно диагностировать несовпадение production direct-PG с локально успешным direct-PG.
3. Проверить live migration journal/RLS/grants после восстановления, затем исправить product-truth copy/visibility для marketplace/verified-organizer обещаний.
