# PROJECT_STATE — GoArgentina / «Пора в Аргентину»

Последняя проверка: **2026-07-29 14:09 ART / 2026-07-29 17:09 UTC**
Статус: **NOT READY**
Фаза: **Wave 1 P0/P1 recovery**

## Конституция

Master Goal V6 принят как главный норматив проекта. Контрольная сумма и источник зафиксированы в `CONSTITUTION.md`.

## Git и candidate state

- Чистая ветка: `codex/master-goal-release-candidate`, base `origin/main` `8d7eec67ad8e9c3eb285fed2fdc39a501838b692`.
- Product implementation SHA: `d6808a5cd546785545149c4c0181345880966d84`; exact evidence/deploy candidate: `d6808a5cd546785545149c4c0181345880966d84`; `origin/main` является ancestor.
- Все шесть доказанных пакетов перенесены последовательно без конфликтов: `41dac6d0`, `20f6b2d4`, `c4f97bda`, `a90f1c11`, `78c8446c`, `a07327db`.
- Пользовательские 24 dirty entries остались только в исходном worktree и не попали в release candidate.
- Последний runtime-product SHA: `d6808a5cd546785545149c4c0181345880966d84` (`fix: bound partner catalog detail fan-out`); WP-020 — `ed29b335`, WP-019 — `a3301ec9`, WP-018 — `8f0dbad2`.

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
- Exact WP-010 SHA `179d3e51` успешно развернут как deployment `4aRm8X7QNDMLPXcoTgZseo64KrSK` в 09:04:49 UTC. Immutable branch preview health связывает полный SHA; promotion не выполняется, потому что data plane unhealthy.
- Exact WP-011 SHA `84988cf` первоначально получил `failure: Account is blocked` в 09:44 UTC, затем success в 09:52:58 UTC и развернулся как deployment `8aKBjCN2veH3BPrjgcpooPVnn7k8`. Immutable branch preview health связывает полный SHA; remote desktop/mobile recovery QA pass, smoke корректно блокируется на unhealthy health.
- Exact WP-012 SHA `77cf5674` сначала получил `failure: Account is blocked` в 10:21 UTC, затем success в 10:30:08 UTC и развернулся как deployment `13SV9JYanV2pCP2ZZwJM9fhrh55f`. Immutable branch preview health связывает полный SHA; remote booking-find/payment-recovery browser QA pass, smoke корректно блокируется на unhealthy health.
- Промежуточный WP-013 SHA `c53b9eb0` отправлен в Vercel в 10:58 UTC и немедленно получил `failure: Account is blocked`; после финальной ledger-provider сверки он заменён exact product SHA `26aeda4c` и не считается release evidence.
- Exact WP-013 SHA `26aeda4c` сначала получил `failure: Account is blocked` в 11:11 UTC, затем success в 11:20:50 UTC и развернулся как Vercel deployment `7w7fLVQJZzod562BUBKVxN1XACUo` (GitHub deployment `5656415601`). Immutable URL: `https://argentina-travel-j1as4a3hd-go-argentina.vercel.app`.
- Exact WP-014 candidate `84f6244b` отправлен в 11:46 UTC, немедленно получил `failure: Account is blocked`, затем success в 11:54:17 UTC и развернулся как Vercel deployment `CJ3fcfursTMefpDtXoJRX7h1TpmN` (GitHub deployment `5656855482`). Immutable URL: `https://argentina-travel-l8ivc8xon-go-argentina.vercel.app`.
- WP-015A exact fail-closed SHA `d576bae2` после initial `Account is blocked` восстановился в 12:34:14 UTC: Vercel deployment `4wqcePJySZY9xf48tRV7eoZfUCrz`, GitHub deployment `5657415437`, immutable URL `https://argentina-travel-fzr22xk1e-go-argentina.vercel.app`.
- WP-016 exact `2fccb050` отправлен в 12:36 UTC и также немедленно получил `failure: Account is blocked`; deployment ID отсутствует. Vercel CLI на правильно linked project IDs отвечает `Not authorized`, поэтому env-name/runtime-log scope независимо подтверждён как недоступный.
- WP-017 exact `a8efc1e6` после initial `Account is blocked` восстановился в 14:03:46 UTC: Vercel deployment `9K5mTZEXjGeWifXFYGMM4FVPLLJk`, GitHub deployment `5657988678`, immutable URL `https://argentina-travel-14eapwolb-go-argentina.vercel.app`. Targeted article browser **1/1**, public/tour suite **16 passed, 1 skipped**; strict и recovery smoke остаются красными из-за недоступного direct PG. Preview закрывает client-transition дефект, но не production promotion.
- WP-018 exact `8f0dbad2` успешно развернут в 13:32:16 UTC: Vercel deployment `E288FhjDXKUA78YQ3ibN54krLY3z`, GitHub deployment `5658339232`, immutable URL `https://argentina-travel-6i6fqeyg8-go-argentina.vercel.app`. Health связывает полный SHA и выбирает только verified `POSTGRES_URL_NON_POOLING`, `supabase_direct`, port 5432, ref `uooxrypocahomoqzdvzy`; generic `POSTGRES_URL` больше не используется. Подтверждённый target недоступен, поэтому tours/excursions корректно 503.
- WP-019 exact `a3301ec9` успешно развернут в 15:41:16 UTC: Vercel deployment `E17wLXYUjTNpHJSN6x1AUQs8rf1J`, GitHub deployment `5660442868`, immutable URL `https://argentina-travel-ia1lcek04-go-argentina.vercel.app`. Health связывает полный SHA, выбирает verified canonical `POSTGRES_URL_NON_POOLING` direct:5432/ref `uooxrypocahomoqzdvzy`, но соединение остаётся down; tours/excursions корректно 503. Remote browser: **16 passed, 1 data-dependent skip**; strict и recovery smoke exit 1 на mandatory health.
- WP-020 exact `ed29b335` успешно развернут в 16:11:01 UTC: Vercel deployment `3hwMwixfCmgr5nx8gWkj26SskbJW`, GitHub deployment `5660918469`, immutable URL `https://argentina-travel-kjjwy06uv-go-argentina.vercel.app`. Health связывает полный SHA; required health и commercial APIs остаются 503/down. Новый parser на HTML `/tours` и `/excursions` возвращает `null`, а не Next asset route; remote browser **16 passed, 1 data-dependent skip**. Strict/recovery smoke exit 1 на mandatory health; promotion не выполнялся.
- WP-021 exact `d6808a5c` отправлен в 17:03 UTC и немедленно получил GitHub/Vercel `failure: Account is blocked`; deployment ID пока отсутствует. Локальный exact artifact полностью доказан, но immutable remote preview и deployment ID не подменяются локальным результатом.
- Production recheck 10:26 UTC: `/api/health`, `/public`, `/database`, `/partners` остаются 503/down на SHA `993e82fb`; `/api/tours` возвращает `200` с 0 tours, `/api/excursions` — `200` с `items=0,total=0`. Production promotion не выполнялся.
- Production recheck 10:58 UTC дал тот же результат: required health 503/down на `993e82fb`, tours/excursions — ложный 200 empty. Promotion не выполнялся.
- Production recheck 11:57 UTC: `/api/health`, `/public`, `/database`, `/partners` — 503/down на старом `993e82fb`; tours/excursions продолжают ложный 200 empty. WP-014 preview не продвигался.
- Production recheck 12:31 UTC: `/api/health`, `/public`, `/database`, `/partners` — 503/down на старом `993e82fb`; `/api/tours` и `/api/excursions` продолжают ложный 200 empty. WP-015A не продвигался.
- Production recheck 13:11 UTC: `/api/health`, `/public`, `/database`, `/partners` — 503/down на старом `993e82fb`; `/api/tours` и `/api/excursions` продолжают ложный 200 empty. WP-017 не продвигался, потому что exact preview не существует и production gate закрыт.
- Production recheck 14:42 UTC: `/api/health/public` и `/database` — 503/down на старом `993e82fb`; `/api/tours` и `/api/excursions` продолжают ложный 200 empty. Ни WP-017, ни WP-018 не продвигались: preview data plane unhealthy, production same-artifact gate закрыт.
- Production recheck 15:45 UTC: `/api/health`, `/public`, `/database`, `/partners` — 503/down на старом `993e82fb`; `/api/tours` и `/api/excursions` продолжают ложный 200 empty. WP-019 не продвигался: exact preview fail-closed, но backend health и same-artifact production gate закрыты.
- Production recheck 16:17 UTC: `/api/health` — 503/down на старом `993e82fb`; `/api/tours` и `/api/excursions` продолжают ложный 200 empty. WP-020 не продвигался.
- Production recheck 17:09 UTC: `/api/health` — 503/down на старом `993e82fb`; `/api/tours` и `/api/excursions` по-прежнему возвращают ложный 200 empty. WP-021 не продвигался, exact deployment отсутствует.

## Supabase, migrations, CMS и recovery

- Канонический production ref: `uooxrypocahomoqzdvzy`; подключённый MCP не имеет к нему доступа.
- REST root cause подтверждён точным ответом `exceed_egress_quota`.
- Локальный production runtime при тех же project settings видит direct Postgres (`tripsterCount=68`), тогда как deployed production direct PG недоступен: это отдельная Vercel runtime/env/connectivity ветка P0.
- Local tree: 107 SQL migrations; live journal/checksum/RLS/grants не подтверждены. Новые DDL не создавались и не применялись.
- WP-016 local runtime безопасно доказал connection fingerprint через `DATABASE_URL`, direct/5432/canonical ref. WP-018 exact preview теперь независимо доказывает verified canonical `POSTGRES_URL_NON_POOLING`; старый production artifact всё ещё не содержит attestation/fingerprint.
- WP-018 доказал, что прежний resolver выбирал первый непустой URL по precedence без проверки project identity. На WP-017 preview победил generic `POSTGRES_URL` с `mode=other`, `port=null`, `projectRef=null`; responsive чужая база с таблицей `tripster_experiences` могла ложно считаться healthy и принимать прямые application mutations.
- Новый resolver сверяет project ref кандидата с trusted `NEXT_PUBLIC_SUPABASE_URL`, принимает только канонический direct/pooler Supabase format, пропускает неподтверждённые/несовпадающие кандидаты и fail-closed возвращает `null`, если verified target отсутствует. Та же attestation используется session revocation, RLS audit и Prisma DB gate. Preview подтвердил выбор нижнего canonical `POSTGRES_URL_NON_POOLING`; соединение не удалось уже после безопасной идентификации target.
- WP-019 распространил ту же строгую attestation на operational tooling: schema/logical backup, restore, migration runners, cross-project copy, partner sync, media/auth maintenance и readiness. Legacy unjournaled admin migration runner теперь всегда fail-closed. Cross-project copy требует два независимых ref, разные проекты и production confirmation даже в dry-run. URL больше не передаётся `pg_dump` как argv.
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
- На снимке WP-006 все тогда учтённые 11 production effects имели статус `unknown_db_down`; unit contract не объявлялся route integration, browser effect или live persistence proof.

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

### WP-010 — payment checkout route integrity

- Stripe и Mercado Pago теперь атомарно фиксируют первого online-провайдера через существующий `bookings.updated_at` CAS до внешнего API. Параллельный другой провайдер проигрывает с 409 и не создаёт checkout; повтор того же провайдера сохраняет стабильный idempotency key.
- Provider result записывается вторым CAS по версии claim, поэтому webhook/admin update между provider creation и persistence не перезаписывается устаревшим snapshot. Версии времени монотонны даже в одном миллисекундном tick.
- Callback/back URLs больше не строятся из request origin и используют canonical site boundary provider helper. Stripe и status routes возвращают только public-safe errors.
- Public payment-link status больше не отдаёт полную CRM-заявку: исключены travelers/passports, телефон, organizer comments, owner identity и private metadata; checkout получает только требуемую bounded projection.
- UI после provider claim принудительно продолжает тот же способ оплаты. Реальные provider/DB/payment вызовы не выполнялись: evidence использует fake DB/providers и invalid-token browser recovery.

### WP-011 — native booking creation integrity

- `price_quote` больше не резервирует inventory: server-owned `reservationSlotDate` существует только для реальной брони с canonical scheduled slot.
- Scheduled booking теперь fail-closed до persistence: если canonical availability slot нельзя подтвердить, route возвращает public-safe 409 и не вызывает atomic booking RPC/notification.
- App Router route integration доказывает canonical price/organizer/status, idempotent replay, fingerprint conflict, slot conflict, quote-without-reservation и отсутствие side effects на invalid captcha/feature boundary.
- Неизвестные storage/RPC детали записываются во внутреннюю telemetry boundary, а клиент получает generic 503 без SQL/config leakage. Live Supabase RPC, RLS, notification delivery и browser completion не заявляются.

### WP-012 — payment webhook ledger integrity

- Stripe и Mercado Pago webhook routes теперь различают `applied`, exact replay, безопасно ignored и retryable storage failure. Ошибка чтения/записи booking возвращает 500, а не маскируется под успешный или отклонённый event.
- HTTP 2xx выдаётся только после durable charge row. Exact replay повторно пытается создать отсутствующий ledger и может восстановить его без повторного booking transition; notification создаётся только после durable ledger и не дублируется при replay существующей операции.
- Charge persistence использует insert-first и существующую partial unique boundary `(provider, external_id)`: duplicate key переводится в точный lookup/update, привязка к другому booking отклоняется, refunded/новое состояние не регрессирует от запоздалого paid event.
- Mercado Pago больше не подменяет notification identity payment resource ID: отсутствие durable notification ID отклоняется до provider fetch и DB. Это соответствует разделению notification `id` и payment `data.id` у провайдера.
- Новая migration не создана: live journal/checksum/RLS/grants всё ещё недоказаны. Commission snapshot остаётся best-effort после durable charge; live provider delivery, Data API/RLS и outbox/commission effects не заявляются.

### WP-013 — refund request/approval route integrity

- Tourist, organizer и admin preparation больше не вычисляют возврат из USD-сводки бронирования. Сервис разрешает единственное завершённое исходное списание и передаёт в атомарный RPC его точную сумму/валюту; admin partial input обязан совпадать с валютой ledger.
- Идентичный UUID replay возвращает существующий refund до нового reserve; смена actor/booking/provider/source/amount/currency даёт безопасный conflict. Cumulative cap, source lock, active-request uniqueness и maker/approver separation остаются в существующем service-role-only RPC.
- POST туриста использует ту же `canAccessBooking`, что GET: совпадение email без `booking.userId` больше не авторизует финансовую мутацию. Organizer ownership и admin personal-session/capability boundaries route-tested.
- Prepare routes не вызывают provider. Approve/reject скрывают сырые provider/SQL ошибки; exact ledger amount/currency теперь показываются без повторной USD-конвертации.
- Новая migration не создана. После неопределённого provider outcome refund может остаться `processing`; безопасный recovery требует lookup/lease/reconcile boundary и live schema/provider evidence, поэтому автоматический retry поверх текущего RPC не добавлялся.

### WP-014 — booking replay actor/response integrity

- POST `/api/bookings` возвращает одинаковый минимальный receipt `{ booking: { id } }` при первом создании и exact replay; canonical CRM row, контакты, travelers/passports, комментарии, payment/traveler/client tokens и metadata наружу не сериализуются.
- `insertCanonicalBookingAtomically` после service-role RPC сравнивает сохранённый `userId` с новым canonical actor и возвращает безопасный 409 при подмене сессии, даже если ключ и fingerprint совпадают.
- Guest replay разрешён только тому же derived guest actor. Подтверждённый same-email пользователь перед replay проходит существующий `attach_guest_bookings_to_current_user`; unrelated account остаётся 409.
- Client/store API сужен до `Pick<Booking, "id">`, что соответствует двум реальным UI-consumers. Новая migration не создана: SQL RPC по-прежнему возвращает internal row единственному wrapper call site; перенос actor predicate внутрь RPC требует доказанной migration parity.

### WP-015A — read-only refund reconciliation

- Root cause подтверждён в реальном execution path: provider может завершить возврат, а локальный `finalize_refund_attempt` — упасть, оставив `processing` без external ID; текущий finalize CAS не имеет recovery lease/token/version. Approval повторно принимает только `pending`, поэтому безопасного владельца recovery нет.
- Finance detail route теперь отдельно загружает source charge и выполняет только GET lookup у Stripe/Mercado Pago. Старый дефект, где refund `externalId` ошибочно использовался как PaymentIntent/payment ID, устранён.
- Классификатор различает exact metadata/external-ID match, candidate, ambiguous, not-found и unavailable. Любой результат имеет `safeToMutate=false`: пустой, усечённый Stripe list, amount-only Mercado Pago match или provider error никогда не разрешают POST retry/finalize.
- Новые Stripe refund requests получают нечувствительный `goargentinaRefundId` metadata для будущей точной корреляции. Существующие записи без metadata показываются как candidates; операторский UI не содержит mutation action и не раскрывает raw provider errors.
- WP-015B — атомарный recovery lease и token-bound finalize/audit — остаётся отдельным P0 после canonical journal/RLS/provider sandbox evidence. Миграции и provider mutation в WP-015A не выполнялись.

### WP-016 — safe direct-Postgres runtime fingerprint

- `resolveDatabaseConnection` теперь сохраняет имя реально выбранного env source и строит публично безопасную диагностику: source, connection mode, effective port и Supabase project ref.
- Health не раскрывает connection string, hostname, username, password или query params. Missing configuration возвращает `connection=null`; существующая fail-closed availability семантика не меняется.
- Local exact runtime подтверждает canonical direct connection через `DATABASE_URL`. После exact Vercel deploy тот же payload позволит отличить wrong source/ref/port от network/runtime failure без чтения секретов.

### WP-017 — fail-soft optional blog tour catalog

- Root cause доказан exact streamed HTML preview: полная SSR-статья присутствовала, а единственный rejected boundary `B:1` с digest `572502285` находился на месте `BlogPostTourEmbeds`. `page.tsx` передавал promise `fetchMarketplaceTours()`, который при total outage/cold LKG отклоняется; обычный `Suspense` изолирует ожидание, но не rejection, поэтому ошибка всплывала в `blog/error.tsx` и скрывала редакционный материал.
- Необязательный коммерческий boundary теперь преобразует только свой catalog rejection в `[]`, логирует generic event без raw provider error и omits embed. Успешный catalog/рендер embed не меняется; CMS body, comments/history и route-wide error semantics не ослаблены.
- Новых API, DDL, migrations или partner writes нет. Production promotion остаётся запрещённым: пакет исправляет публичную устойчивость, но не лечит Supabase quota/direct-PG/Vercel access.

### WP-018 — canonical direct-Postgres target attestation

- Root cause: общий resolver считал «configured» первый непустой Postgres URL и не связывал его с каноническим Supabase ref. Health, catalog fallbacks и прямые mutation/audit paths могли обращаться к unknown/mismatched target.
- Shared parser извлекает ref только из официальных direct/pooler Supabase форматов. Resolver сравнивает его с trusted public project URL; unverified/mismatch никогда не подключается, а диагностический payload показывает только source/mode/port/ref/`targetStatus`.
- `auth-sessions`, RLS audit и Prisma DB gate переведены на ту же attestation. Readiness теперь отдельно блокирует production-like runtime при `target_unverified`/`target_mismatch`; contract tests защищают bypass paths. DDL, secret/env changes и внешние writes не выполнялись.

### WP-019 — operational Postgres target attestation

- Root cause: operational Node ESM scripts продолжали брать первый непустой `DATABASE_URL`/`POSTGRES_URL`, а logical backup использовал substring matching ref. Backup/restore, миграции, partner sync и maintenance могли подключиться к unknown/mismatched target вне runtime guard WP-018.
- Создан единый fail-closed parser/resolver для official Supabase direct/pooler URL, независимого trusted ref и safe diagnostics. Все найденные `pg.Client`, `pg_dump` и `psql` operational paths удостоверяют target до connection/process spawn; backup credentials передаются через process env, а не URL argv.
- Legacy unjournaled migration runner отключён; journaled staging требует explicit ref/public URL agreement. Data-copy требует source/target attestation, разные refs и production confirmation независимо от dry-run. Review нашёл и закрыл первоначальный dry-run bypass до commit.

### WP-020 — commercial smoke evidence integrity

- Root cause: `findCommercialDetailPath` сканировал любое совпадение `/tours/<slug>` или `/excursions/<slug>` во всём Next HTML. Имена JS chunks `app/tours/error-*.js` и `app/excursions/error-*.js` удовлетворяли форме, потому что исключались только `city`/`region`.
- Parser теперь принимает только HTML `href=` или сериализованное RSC-поле `href`, нормализует escaped slash/quote и отклоняет `city`, `guide`, `region`, `error-*`, `page-*` и path-shaped text без href boundary.
- Параллельный exact browser QA дополнительно воспроизвёл P1-GA-017: 5 workers дали partner 429/timeouts и direct-PG `too many clients`/reserved slots. Source trace: оба public-detail filter используют unbounded `Promise.all`, а Tripster/YouTravel PG fallback создаёт отдельный `pg.Client` на каждую detail resolution. Последовательный 1-worker прогон 17/17 подтверждает отсутствие WP-020 UI-регрессии, но не закрывает capacity root cause.
- DDL, migration execution, secret/env mutation, backup/restore и partner write не выполнялись. Local exact health/browser выполняли только штатные application reads; DB/provider writes не выполнялись. Пакеты доказывают control/read paths, а не live mutation effect.

### WP-021 — bounded catalog detail and partner Postgres pressure

- Root cause подтверждён source trace и прежним exact load: два public-detail filter запускали весь Argentina catalog через неограниченный `Promise.all`; каждая карточка могла последовательно обратиться к platform/YouTravel/Tripster/reviews, а оба direct-PG репозитория создавали отдельный `pg.Client`. Текущие cache boundaries не дедуплицировали overlapping cold requests, partner reads не имели общего deadline, а REST query error местами превращался в `null`/`[]`.
- Anonymous catalog resolver теперь использует FIFO concurrency=3 и in-flight dedupe по slug. Map очищается после любого settled результата: временная недоступность не становится negative cache; direct calls с access token не входят в shared anonymous path.
- Tripster/YouTravel fallback используют общий attested `pg.Pool` max=2, idle=10s, connection/query/statement timeout=8s. Configured canonical Supabase transaction mode 6543 сохраняется; приложение не повышает quota и не превращает его скрыто в session mode 5432.
- Primary REST query error теперь бросается и сохраняет `unavailable`; `missing`/empty допустимы только после успешного чтения. Catalog partner/token/public JSON/HTML/curl reads имеют 8-секундный предел, а YouTravel 429 retry ограничен 1 секундой.
- Exact local SHA `d6808a5c`: direct PG healthy, REST quota degraded; serial browser **17/17**, cold parallel 5-worker browser **17/17**. В 107 044 байтах parallel server log: `too many clients`=0, reserved slots=0, partner 429=0, timeout=0, pool idle error=0. Strict smoke exit 1 на mandatory health; explicit recovery smoke exit 0 с настоящими `/tours/...yt52537` и `/excursions/...t50900`.
- DDL/migration/provider/DB write, env/secret mutation и production promotion не выполнялись. Pool/process limiter действует на warm instance, не является distributed global capacity control; remote exact preview и healthy production load proof остаются обязательными.

## Проверки candidate

- WP-021 focused concurrency/pool/truth/deadline suite: **6 files / 24 tests** — pass. Финальный `npm run audit:quick`: TypeScript + ESLint + fresh inventory + **443 files / 2 105 tests** + **31/31 release-evidence contracts** — pass. `npm audit --omit=dev`: **0 vulnerabilities**.
- Protected production build exact `d6808a5c`: exit 0, **929/929** static pages, runtime-text audit pass, production mode/demo seeds off. Build logs честно фиксируют Supabase REST `exceed_egress_quota`; generated timestamp возвращён к committed state, worktree clean.
- Exact local runtime health связывает полный SHA: canonical direct PG `ok=true`, общий health 503/degraded из-за REST quota. Browser serial **17/17** и cold parallel five-worker **17/17**; parallel log не содержит slot/429/timeout exhaustion. Strict smoke exit 1; explicit recovery smoke exit 0 и проверяет реальные commercial details.
- GitHub push exact `d6808a5c` выполнен. Initial Vercel status в 17:03 UTC — `failure: Account is blocked`; deployment ID/immutable preview/remote browser отсутствуют и не считаются пройденными.

- WP-017 focused fault/UX suite: **3 files / 56 tests** — pass. `npm run audit:quick`: TypeScript + ESLint + fresh inventory + **439 files / 2 084 tests** + **8 release-evidence tests** — pass.
- Protected production build exact `a8efc1e6`: exit 0, **806/806**, runtime-text audit pass, demo auth markers absent. Build/runtime logs независимо воспроизводят canonical Supabase `exceed_egress_quota`; article HTTP 200 сохраняет правильный H1.
- Local exact browser QA: targeted Iguazú article **1/1**, полный public desktop/mobile suite **17/17**; visual capture содержит длинную статью без route error overlay. Strict smoke exit 1 на mandatory `ok=false`; explicit recovery smoke exit 0 и включает обе blog routes.
- Immutable WP-017 preview `a8efc1e6` / `9K5mTZEXjGeWifXFYGMM4FVPLLJk`: targeted article **1/1**, public/tour suite **16 passed, 1 skipped**, admin auth guard 307; strict и recovery smoke exit 1 из-за down direct PG. Статья доказана на exact remote artifact; production остаётся старым и unhealthy.
- WP-018 focused target/health/readiness/bypass suite: **6 files / 41 tests** — pass. Финальный `npm run audit:quick`: TypeScript + ESLint + fresh inventory + **440 files / 2 095 tests** + **8 release-evidence tests** — pass.
- Protected build exact `8f0dbad2`: **806/806**, runtime-text pass, demo auth absent. Первая попытка остановилась только на `ENOSPC`; удалены только воспроизводимые `.next`/`.next-production` caches candidate, затем build пересоздан успешно.
- Local exact runtime: direct PG verified через `DATABASE_URL`, port 5432, canonical ref, `tripsterCount=68`; Data API down по quota. Public browser **17/17**, article H1/28 601 chars/без overlay/console errors; strict smoke exit 1, explicit recovery smoke exit 0.
- Immutable WP-018 preview `8f0dbad2` / `E288FhjDXKUA78YQ3ibN54krLY3z`: full SHA, verified canonical `POSTGRES_URL_NON_POOLING`, но direct PG и REST down; tours/excursions 503, blog 200, admin guard 307. Browser: smoke tests **13 passed**; tour UX **1 failed, 2 not run** на явном unavailable state. Strict и recovery smoke exit 1. Это безопасный fail-closed release candidate, не production-ready backend proof.
- WP-019 focused operational-target suite: **20/20**; `audit:quick`: TypeScript + ESLint + fresh inventory + **440 files / 2 095 tests** + **28/28 release-evidence contracts** — pass. Nonconnecting guard probes для backup/auth/sync/migration/legacy runner завершились до сети/БД и не раскрыли URL/credentials.
- Protected production build exact `a3301ec9`: exit 0, **929/929** static pages, runtime-text pass, demo auth markers absent. Первая попытка fail-closed остановилась без public Supabase env, вторая — без canonical site URL; финальная explicit production build успешна. Build наблюдал существующий `exceed_egress_quota`, но не выполнял миграции.
- Local exact public smoke pass; Chromium public/mobile browser **17/17**. Strict production-equivalent smoke exit 1 на `health.ok=false`; explicit recovery smoke прошёл, но выявил отдельный P1 evidence root cause: `/tours/error-*` и `/excursions/error-*` ошибочно распознавались как commercial detail.
- Immutable WP-019 preview `a3301ec9` / `E17wLXYUjTNpHJSN6x1AUQs8rf1J`: health 503/down с verified canonical target; tours/excursions 503, home/blog 200. Browser **16 passed, 1 data-dependent skip**. Strict и recovery smoke exit 1; commercial backend effect не доказан.
- WP-020 focused commercial-smoke contracts: **6/6**; `audit:quick`: TypeScript + ESLint + fresh inventory + **440 files / 2 095 tests** + **31/31 release-evidence contracts** — pass. `npm audit --omit=dev`: **0 vulnerabilities**.
- Protected production build exact `ed29b335`: exit 0, **929/929** static pages, runtime-text pass, demo auth markers absent. Build повторно наблюдал Supabase `exceed_egress_quota`, но миграции/DB writes не выполнялись.
- Local exact browser: parallel 5-worker run **2 passed, 5 failed, 10 not run** на partner timeout/429 и PG slot exhaustion; deterministic 1-worker rerun **17/17**. Strict smoke exit 1 на degraded health; explicit recovery smoke exit 0 и выбирает настоящие `/tours/...yt52537` и `/excursions/...t50900`.
- Immutable WP-020 preview `ed29b335` / `3hwMwixfCmgr5nx8gWkj26SskbJW`: full SHA; health/public/database/partners и tours/excursions API 503/down; `/` и `/blog` 200. Browser **16 passed, 1 data-dependent skip**. Both strict/recovery smoke exit 1 because verified direct PG is down. HTML parser returns no commercial detail for both broken catalogs, so false pass is closed.

- WP-015A focused route/classifier/provider suite: **3 files / 13 tests** — pass, включая fail-closed `has_more`, Stripe metadata exact-match и Mercado Pago amount-only ambiguity.
- `npm run audit:quick`: TypeScript + ESLint + inventory stale-check + **438 files / 2 080 tests** + **8 release-evidence tests** — pass; существующие lint warnings не стали errors.
- Protected production build exact `d576bae2`: exit 0, **806/806** static pages, runtime-text audit pass, demo auth markers absent.
- Local exact `.next-production`: health связывает полный SHA; Data API 503/degraded из-за `exceed_egress_quota`, direct PG healthy (`tripsterCount=68`); admin payments без сессии → 307 sign-in. Browser QA **17/17 pass**. Строгий smoke exit 1 на mandatory health; explicit recovery-smoke exit 0. Refund/provider POST не выполнялись.
- Immutable WP-015A preview `d576bae2` / `4wqcePJySZY9xf48tRV7eoZfUCrz`: health 503/down связывает полный SHA; REST/direct PG недоступны; admin payments auth guard → 307. Строгий smoke exit 1. Remote browser: **9 passed, 1 skipped, 1 failed, 6 not run** — статья Игуасу после client load одновременно имела error-boundary и скрытый article H1. Preview exact, но browser acceptance не пройден.
- WP-016 focused health/database suite: **3 files / 10 tests** — pass. `audit:quick`: TypeScript + ESLint + inventory + **438 files / 2 081 tests** + **8 evidence tests** — pass. Protected build exact `2fccb050`: **806/806**, runtime-text audit pass, demo auth markers absent. Local health exact SHA: direct PG healthy, canonical safe fingerprint present; remote deployment отсутствует.

- WP-014 focused actor/response suite: **4 files / 21 tests** — pass; route matrix включает same account, same guest, confirmed guest→account attach, unrelated actor denial, fingerprint conflict и ID-only first/replay response.
- `npm run audit:quick`: TypeScript + ESLint + inventory stale-check + **436 files / 2 070 tests** + release-evidence contracts — pass; существующие lint warnings не выросли в ошибки.
- Critical evidence `booking.create` остаётся `integration_tested`, но теперь явно связывает bounded response и actor ownership; current digest `13df49bae362e0fd`, live effect остаётся `unknown_db_down`.
- Candidate-integrity journey gate на чистом `32038cc9`: integrity pass/dirty paths 0; Playwright **16 passed, 1 skipped**. Evidence закреплён commit `84f6244b`.
- Protected production build exact `84f6244b`: первая попытка fail-closed на локальном demo-seed env и отклонена; финальная explicit production build exit 0, **929/929**, runtime-text audit pass, demo auth markers absent.
- Local exact `.next-production`: health связывает полный SHA; Data API 503/degraded, direct PG healthy (`tripsterCount=68`); `/booking/find` 200, tours 503, excursions partial 200/59. Строгий smoke exit 1 на mandatory health; explicit recovery-smoke exit 0.
- Полный parallel browser run exact bundle не принят: 5 навигаций истекли после Supabase outage + Tripster 429/YouTravel timeout storm; два теста прошли. После clean restart последовательный safe booking/auth/health browser QA — **3/3 pass**. Никакой booking POST или live persistence не выполнялись.
- Immutable WP-014 preview `84f6244b` / `CJ3fcfursTMefpDtXoJRX7h1TpmN`: health 503/down связывает полный SHA, REST/direct PG недоступны; `/booking/find` 200, tours/excursions fail-closed 503. Remote browser smoke **16 passed, 1 skipped**; строгий production smoke exit 1 на mandatory health. Booking POST/live persistence не выполнялись.

- WP-013 focused refund/inventory suite: **5 files / 21 tests** — pass; core refund route/service/approval set **4 files / 16 tests**.
- `npm run audit:quick`: TypeScript + ESLint + inventory stale-check + **435 files / 2 063 tests** + release-evidence contracts — pass; существующие lint warnings не выросли в ошибки.
- Critical evidence `booking.refund.request` повышен с `contract_tested` до `integration_tested`: owner/organizer route, email-only denial, ARS ledger authority и UUID replay связаны с точными тестами; live DB/RLS/provider остаются `unknown_db_down`.
- Protected production build exact `26aeda4c`: ранний packet-run fail-closed из-за отсутствующего локального `NEXT_PUBLIC_SITE_URL` отклонён; финальный explicit canonical build exit 0, **929/929**, runtime-text audit pass, demo auth markers absent.
- Local exact `.next-production`: health связывает полный SHA, Data API 503/degraded, direct PG healthy (`tripsterCount=68`); unauthenticated tourist refund и admin approve возвращают 401 до финансового сервиса, `/booking/find` 200.
- Browser smoke exact `26aeda4c`: **16 passed, 1 skipped**. Строгий production smoke exit 1 на mandatory health; explicit recovery-smoke pass и фиксирует `/tours`/`/excursions` error-boundary redirects. Provider POST и refund mutation не выполнялись.
- Immutable WP-013 preview `26aeda4c` / `7w7fLVQJZzod562BUBKVxN1XACUo`: health 503/down связывает полный SHA, REST/direct PG недоступны; `/booking/find` 200, unauthenticated refund POST 401. Remote browser smoke **16 passed, 1 skipped**; строгий smoke exit 1 на mandatory health. Provider/refund mutation не выполнялись.

- Текущий `npm run audit:quick`: TypeScript + ESLint + inventory stale-check + **432 files / 2 053 tests** + **8 release-evidence tests** — pass.
- WP-012 focused signed-route/state/ledger suite: **4 files / 33 tests** — pass; настоящий HMAC raw-body Stripe request и signed Mercado manifest проходят App Router handlers с fake provider/store.
- Security audit: production dependencies **0 vulnerabilities**; static RLS audit **153 tables / 0 critical**; secret-pattern scan pass.
- Current critical evidence snapshot: **12×20**, source-only **0**, webhook route integration добавлен к Stripe/Mercado; digest `9b16357674713a74`. Все live production effects остаются `unknown_db_down`.
- Protected production build exact `77cf5674`: exit 0, **929/929** static pages, runtime-text audit pass, demo auth markers absent. Local health связывает полный SHA; REST health 503/degraded, direct PG healthy (`tripsterCount=68`).
- Candidate-integrity journey gate exact `77cf5674`: integrity pass/dirty paths 0; Playwright **16 passed, 1 skipped**. Строгий production smoke exit 1 на mandatory health; recovery-smoke pass только с явным `ALLOW_DEGRADED_HEALTH=1` и зафиксировал `/tours`/`/excursions` error-boundary redirects.
- Browser QA exact `.next-production`: `/booking/find` доступен; invalid payment token завершает загрузку public-safe error/support path. Главная после client load переходит в `Не удалось загрузить страницу` из-за недоступного data plane; это P0 evidence, не acceptance.
- Immutable WP-012 preview `77cf5674` / `13SV9JYanV2pCP2ZZwJM9fhrh55f`: health 503/down связывает полный SHA, REST и direct PG недоступны; `/booking/find` и invalid-token payment recovery — 200 и browser-pass. Строгий smoke exit 1 на mandatory health. POST webhook/payment не выполнялись.
- WP-011 focused route/integrity suite: **3 files / 14 tests** — pass; настоящий App Router POST handler с fake atomic store доказывает ровно одну persistence/reservation/notification при idempotent replay и ноль reservations для `price_quote`.
- Current critical evidence snapshot: **12×20**, source-only **0**, route-integration present in **7** journeys, unit-contract present in **7**; digest `96ed41192b3e202f`. Все live production effects остаются `unknown_db_down`.
- Protected production build exact `84988cf`: exit 0, **929/929** static pages, runtime-text audit pass, demo auth markers absent. Local health связывает полный SHA, Data API 503/degraded, direct PG healthy (`tripsterCount=68`); штатный smoke exit 1 на mandatory health gate.
- Candidate-integrity journey gate exact `84988cf`: integrity pass/dirty paths 0; Playwright **16 passed, 1 skipped**. Отдельный исправленный mobile detail check — **1 passed**; production acceptance не ослаблен.
- Browser QA exact `.next-production`: desktop 1280×720 `/booking/find` и mobile 390×844 invalid payment token recovery; H1/form/support path доступны, horizontal overflow и console errors — 0. POST booking/payment не выполнялись.
- Immutable WP-011 preview `84988cf` / `8aKBjCN2veH3BPrjgcpooPVnn7k8`: health 503/down связывает полный SHA; booking find и invalid-token recovery routes — 200. Desktop 1280×720 и mobile 390×844: required UI/recovery path доступны, horizontal overflow/console errors — 0; штатный smoke exit 1 на mandatory health gate. POST booking/payment не выполнялись.
- Canonical production recheck 09:50 UTC: health/public/database/partners — 503/down на старом SHA `993e82fb`; tours/excursions продолжают ложный 200 empty. Promotion не выполнялся.
- WP-010 focused route/integrity suite: **3 files / 21 tests** — pass, включая настоящий `Promise.all` двух App Router handlers с fake atomic store, webhook interleaving, hostile request origin и bounded capability projection.
- WP-010 critical evidence snapshot: **12×20**, source-only **0**, route-integration present in **6** journeys, unit-contract present in **7**; digest `b869f5e97d869917`. Все live production effects оставались `unknown_db_down`.
- Protected production build exact `179d3e51`: exit 0, **685/685** static pages, runtime-text audit pass, demo auth markers absent. Первый preview стартовал из stale `.next-production`, потому что Vercel env направил build в `.next`; evidence был отклонён. Финальный build явно использует `NEXT_DIST_DIR=.next-production` и exact SHA.
- Local production-equivalent exact `179d3e51`: health 503/down с exact SHA; invalid payment-link status 503 с `SERVICE_UNAVAILABLE` без internal error; штатный smoke exit 1 на mandatory health gate. Browser QA invalid-token payment/result recovery pass на 1440×900 и 390×844; provider actions не запускались.
- Immutable WP-010 preview `179d3e51` / `4aRm8X7QNDMLPXcoTgZseo64KrSK`: health 503/down связывает полный SHA; unknown payment-link token возвращает public-safe 404; desktop 1440×900 payment recovery и mobile 390×844 result recovery pass. Штатный smoke exit 1 на mandatory health gate; provider POST/valid token/payment/webhook не выполнялись.
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
- Canonical production recheck 09:00 UTC: health/public/database/partners — 503/down на старом SHA `993e82fb`; tours/excursions всё ещё возвращают ложный 200 empty на outage. Candidate не продвигался.
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

1. **P0-GA-001:** восстановить canonical Supabase REST и verified direct PG. WP-018 exact preview доказывает правильный canonical target, но оба канала остаются down.
2. **P1-GA-004/006/007:** вернуть Supabase scope, доказать migration parity/RLS/grants и recoverability.
3. **P1-GA-005:** WP-017/WP-018 exact previews созданы, но recurring account volatility и read-only Vercel project/runtime-log scope остаются открыты.
4. **P1-GA-010:** production analytics/consent/conversion evidence остаётся непригодным до healthy deployment.
5. **P1-GA-012:** route evidence и CAS исправлены; DB-level unique active request, durable audit и live deletion processor effect не доказаны.
6. **P1-GA-013:** identity retry и terminal-state monotonicity исправлены; DB uniqueness, lease/recovery, durable audit и live multi-system effect остаются недоказанными.
7. **P0-GA-014:** checkout race/origin/PII boundary исправлены и fake-tested; valid-token live DB/provider/webhook effect не доказан из-за P0-GA-001 и не выполнялся на production.
8. **P0-GA-015:** quote/inventory и scheduled fail-open исправлены и route-tested; live atomic RPC, RLS, notification delivery и end-to-end booking completion не доказаны из-за P0-GA-001.
9. **P0-GA-016:** code-level webhook ledger/replay repair реализован и fake-tested; live provider/Data API/RLS/commission/outbox effect не доказан.
10. **P0-GA-017:** refund currency/ownership/replay boundary исправлена; WP-015A добавил fail-closed provider diagnosis/UI. Live RPC/RLS/provider effect и WP-015B atomic lease/token-bound finalize всё ещё не доказаны.
11. **P1-GA-014:** booking replay response/actor boundary исправлена и route/service-tested; live RPC/attach/RLS effect и DB-layer owner predicate не доказаны.
12. **P1-GA-015:** root cause и fail-soft boundary исправлены и доказаны на exact immutable preview `9K5mTZ…`; production same-artifact behavior не доказано из-за P0 data plane.
13. **P0-GA-018:** application и operational direct-PG target attestation исправлены и доказаны на exact previews `E288Fh…`/`E17wLXY…`; verified target connectivity и production same-artifact proof остаются открыты.
14. **P1-GA-016:** commercial smoke false positive исправлен и доказан на exact preview `ed29b335` / `3hwMwixf…`; production остаётся на старом parser/artifact, same-artifact production proof заблокирован P0-GA-001.
15. **P1-GA-017:** bounded fan-out, in-flight dedupe, shared pool/deadlines и error-vs-empty semantics реализованы в `d6808a5c`; local cold five-worker evidence закрывает воспроизведённое slot exhaustion. Immutable preview, distributed multi-instance capacity и production same-artifact proof остаются открыты.

## Следующие три задачи

1. Release/engineering: дождаться или восстановить Vercel build path для exact `d6808a5c`, получить deployment ID и повторить immutable health + 5-worker/browser + strict/recovery smoke; promotion не выполнять.
2. Owner/ops: снять Supabase `exceed_egress_quota` и восстановить canonical verified runtime connectivity; engineering сразу повторяет strict catalog/detail/load smoke на том же artifact.
3. Engineering/ops: после read-only восстановления сверить 107 migrations/journal/checksums, RLS/grants и backup/PITR posture; затем проектировать WP-015B lease без DDL до parity/provider sandbox.
