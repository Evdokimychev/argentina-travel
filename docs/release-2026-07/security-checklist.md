# Security checklist — release 2026-07

**Область:** Auth, reset/change password, OTP поиска заявки, sessions, RBAC, RLS, privacy, consent, security headers, secrets и зависимости.
**Проверено:** 2026-07-15, `HEAD 8ddef6615adb79069c444738e83a4b24bfefcef8`.
**Итог:** **BLOCKED — выпускать нельзя до устранения SEC-001 и повторной проверки SEC-002–SEC-006.**

Аудит выполнен без отправки писем, создания пользователей, записи в production БД и изменения product-кода. Production использовался только для безопасного `HEAD`-запроса заголовков. Подключённый live-проект Supabase не запрашивался и не изменялся.

## Release blockers

| ID | Sev | Статус | Проблема | Доказательство | Что считать исправлением |
|---|---|---|---|---|---|
| SEC-001 | **P0** | confirmed | **Самостоятельное получение роли admin при прямой регистрации через публичный Supabase Auth.** Триггер доверяет `raw_user_meta_data.role`; пользователь может передать `role=admin` напрямую, минуя API сайта. Профиль получает `roles=['admin']`, а отсутствие строки `admin_staff` трактуется как bootstrap с полным доступом. | `supabase/migrations/20250612000000_auth_profiles_bookings.sql:34-73`; `src/lib/admin/staff.ts:61-103`; `supabase/migrations/20250619000000_admin_panel.sql:186-195`. Это противоречит официальной модели Supabase: `raw_user_meta_data` изменяется пользователем и не подходит для авторизации. | Новая регистрация всегда создаёт только безопасную базовую роль; admin назначается только доверенной серверной операцией. Удалён bootstrap «admin без staff = полный доступ» либо он ограничен явным allowlist. Миграция исправляет уже созданные подозрительные профили после отдельного read-only отчёта. Есть негативный интеграционный тест прямого `signUp(data.role=admin)` и RBAC-тесты. |
| SEC-002 | **P1** | confirmed | **Публичный lookup по телефону раскрывает email, набор ролей и активную роль.** Авторизация не требуется. | `src/app/api/auth/lookup-phone/route.ts:7-37`. Ответ `404` также подтверждает отсутствие номера. | Endpoint не возвращает PII/roles и не различает существование аккаунта. Предпочтительно убрать вход по телефону без настоящего OTP; временно оставить нейтральный ответ и email-вход. Негативный API-тест проверяет одинаковый статус, тело и близкое время ответа. |
| SEC-003 | **P1** | confirmed | **Email/phone enumeration встроен в основной вход.** Email lookup возвращает `found`, `not_found`, `unconfirmed`, `needs_repair`; регистрация отдельно сообщает duplicate email/phone. Мастер-промпт прямо блокирует release при auth enumeration. | `src/app/api/auth/lookup-email/route.ts:5-34`; `src/lib/auth-client.ts:8-30`; `src/lib/auth-register-server.ts:59-76`; `src/components/auth/AuthModal.tsx` использует lookup для выбора входа/регистрации. | Единый нейтральный UX и API-контракт без раскрытия наличия/статуса аккаунта; rate limit по IP и нормализованному идентификатору; тесты на одинаковые ответы и отсутствие PII в логах. |
| SEC-004 | **P1** | confirmed | **После удаления аккаунта исходные email и имя сохраняются в `privacy_requests.metadata`.** Процесс завершения объединяет старую metadata с техническими полями, поэтому PII не очищается. | Запись PII: `src/app/api/privacy/delete-request/route.ts:54-65`. Сохранение прежней metadata: `src/lib/privacy/delete-automation.ts:211-223`. | До `completed` удалить/псевдонимизировать PII из metadata и reason/notes по утверждённой retention-модели; покрыть тестом полного набора таблиц и полей. Не удалять финансовые записи, которые необходимо хранить, но отделить юридически обязательные данные от пользовательского профиля. |
| SEC-005 | **P1** | confirmed | **OTP проверки заявки не атомарен.** Проверка состояния, увеличение attempts и пометка `consumed_at` выполняются отдельными запросами. Параллельные запросы могут пройти на одном коде или превысить лимит попыток; это не закрывает требования replay/attempt limits. | `src/app/api/bookings/lookup/verify/route.ts:32-72`. Таблица имеет поля лимита, но нет атомарной RPC/условного update: `supabase/migrations/20250714000000_secure_booking_lookup.sql:4-16`. | Атомарная DB-функция/транзакция с блокировкой строки и условием `consumed_at is null`, `expires_at > now()`, `attempts < max_attempts`; ровно один успешный session token. Конкурентный тест на replay и параллельные неверные попытки. |
| SEC-006 | **P1** | confirmed | **Маркетинговая attribution-cookie ставится до согласия.** Middleware и клиент сохраняют UTM, referrer, landing URL и partner/API identifier на 90 дней независимо от выбора пользователя. Это расходится с заявлением «необязательное только после согласия» и release gate `privacy consent enforced`. | `src/middleware.ts:23-53`; `src/components/attribution/FirstTouchAttributionCapture.tsx:7-14`; `src/lib/attribution/first-touch.ts:94-128`. | Классифицировать attribution как analytics/marketing и записывать только после соответствующего согласия либо документированно обосновать строго необходимую категорию и минимизировать срок/поля. Clean-browser тест подтверждает отсутствие cookie/storage до согласия и удаление при отзыве. |

## Important findings

| ID | Sev | Статус | Наблюдение / риск | Evidence / действие |
|---|---|---|---|---|
| SEC-007 | P2 | confirmed | Consent не имеет версии и фактического expiry. `localStorage` бессрочен, а `decidedAt` только проверяется на непустое значение; старое значение `accepted` также навсегда включает всё. | `src/lib/cookie-consent.ts:25-46,93-117`. Добавить `version`, `expiresAt`, миграцию старого формата и повторный запрос при изменении политики/истечении срока. |
| SEC-008 | P2 | confirmed | Password policy расходится: регистрация принимает 6 символов, смена пароля требует 8. Проверки сложности/скомпрометированных паролей в приложении не подтверждены. | `src/lib/auth-register-server.ts:43-45`; `src/app/api/auth/update-password/route.ts:16-23`. Установить единый минимум и сверить dashboard Auth policy. |
| SEC-009 | P2 | confirmed | App rate limiter при отсутствии/сбое Upstash переходит на память одного serverless-инстанса. Это не глобальная защита от перебора. Production-настройка Upstash в этом аудите не проверялась. | `src/lib/rate-limit/index.ts:64-73,141-162`. Для auth/OTP fail closed или централизованный лимит; добавить readiness-проверку обязательных env без вывода значений. |
| SEC-010 | P2 | confirmed | Нет Content-Security-Policy. Остальные базовые заголовки присутствуют и подтверждены на production, но многочисленные `dangerouslySetInnerHTML` делают CSP особенно важным вторым рубежом. | `next.config.ts:38-56`; production `HEAD /`: HSTS, X-Frame-Options, nosniff, Referrer-Policy и Permissions-Policy есть, CSP отсутствует. Ввести nonce/hash-based CSP сначала в report-only, затем enforce. |
| SEC-011 | P2 | confirmed | Production dependency audit: 2 moderate, 0 high/critical. Уязвим `postcss@8.4.31`, вложенный в `next@15.5.19` (`GHSA-qx2v-qp2m-jg93`, XSS при stringify CSS). Автофикс npm предлагает некорректный downgrade Next, поэтому нужен контролируемый upgrade/override с build regression. | `npm audit --omit=dev --json`, 2026-07-15; `npm ls next postcss --all`. |
| SEC-012 | P2 | partial | Static RLS audit зелёный, но проверяет только наличие `ENABLE RLS` и хотя бы одной policy, а не смысл policy, grants, ownership, `SECURITY DEFINER` или реальные роли. Поэтому он не заметил SEC-001. | Read-only запуск: 84 таблицы, 0 structural issues. Ограничение видно в `src/lib/supabase/rls-audit-static.ts:19-79`. Нужны live advisors и матричные SQL-тесты anon/user A/user B/organizer/admin. |
| SEC-013 | P2 | confirmed | Две policy используют deprecated `auth.role()` для service role. Текущая цель узкая, но код следует привести к `TO service_role`. | `supabase/migrations/20250629000000_youtravel_affiliate.sql:94`; `supabase/migrations/20250630200000_youtravel_affise_snapshots.sql:19`. |
| SEC-014 | P2 | partial | Privacy export авторизован и использует owner-scoped запросы, но экспортирует только профиль, бронирования, отзывы и сообщения. Favorites, interactions, subscriptions, notifications, trip-prep и прочие связанные данные не включены. | `src/lib/privacy/export-user-data.ts:50-94`. Согласовать обязательный охват и добавить contract test. |
| SEC-015 | P2 | partial | Удаление аккаунта и экспорт не требуют свежей повторной аутентификации. SameSite cookies снижают обычный CSRF-риск, но украденная активная сессия позволяет запросить чувствительную операцию. | `src/app/api/privacy/export/route.ts:7-26`; `src/app/api/privacy/delete-request/route.ts:10-81`. Добавить recent-auth/reauth для удаления и, по модели риска, экспорта. |
| SEC-016 | P2 | partial | `SECURITY DEFINER` функции в `public` не имеют единообразного явного revoke. Atomic booking RPC ограничены корректно; trigger-функции напрямую не вызываются, а `is_admin_with` нужен RLS, но grants должны быть явными и проверяться advisor-ом. | SQL scan: 7 `SECURITY DEFINER`; явный revoke подтверждён у atomic create/cancel. Выполнить live `information_schema.routine_privileges`/`pg_proc` аудит без изменений. |

## Control checklist

Легенда: ✅ подтверждено; ⚠️ частично/нужна дополнительная проверка; ❌ блокер; ⏸ не проверялось из-за запрета на production mutation/email.

### Auth, reset, sessions

- ❌ Регистрация не защищена от прямой передачи admin в user metadata: SEC-001.
- ❌ Защита от account enumeration отсутствует: SEC-002, SEC-003.
- ✅ Reset endpoint отвечает нейтрально при успешном запросе и валидирует email: `src/app/api/auth/request-password-reset/route.ts`.
- ✅ Recovery redirect ограничен внутренним маршрутом; token/code удаляется из адресной строки после обмена: `src/app/auth/confirm/route.ts`, `src/lib/auth-flow.ts`.
- ✅ Смена пароля требует recovery-cookie и действующего Supabase user, затем выполняет global sign-out: `src/app/api/auth/update-password/route.ts`.
- ✅ Recovery-cookie `HttpOnly`, `SameSite=Lax`, `Secure` в production, TTL 15 минут.
- ✅ Брендированные шаблоны присутствуют для signup, recovery, email change, magic link, invite, reauthentication и password-changed notification: `supabase/templates/`, `supabase/config.toml`.
- ⚠️ `auth:readiness` прошёл для ожидаемого project ref `uooxrypocahomoqzdvzy`, но в текущем shell canonical URL не задан; проверка не доказывает dashboard redirect allowlist, SMTP или rate-limit настройки.
- ⏸ Реальное письмо, одноразовость recovery link, новый пароль → новый вход → `/profile`, session rotation и уведомление о смене пароля не повторялись: это отправило бы email/изменило production.
- ℹ️ SMS OTP не реализован и UI его не обещает; телефонный вход сейчас переводит телефон в email, что небезопасно (SEC-002).

### OTP поиска заявки

- ✅ Email и OTP не хранятся открытым текстом; используются HMAC, криптографический код, короткие TTL и HttpOnly session-cookie: `src/lib/booking-lookup-security.ts`.
- ✅ Начальный ответ нейтрален, результаты требуют purpose-bound cookie; RLS/grants таблиц challenge закрыты для anon/authenticated.
- ✅ Есть expiry 10 минут, session 15 минут, максимум 5 попыток и audit trail без открытого IP.
- ❌ Replay и attempt limits не атомарны: SEC-005.
- ⚠️ Результат можно читать повторно до истечения session TTL; это допустимо для сессии, но должно быть явно принято как продуктовый контракт.
- ⏸ Доставка кода и production lookup не запускались.

### RBAC and admin isolation

- ❌ Корень доверия ролям скомпрометирован при signup: SEC-001.
- ✅ Middleware проверяет серверного Supabase user, `profiles.roles` и блокировку для `/profile`, `/organizer`, `/admin`: `src/middleware.ts:215-298`.
- ✅ Смена workspace проверяет доступность по серверным ролям и сама не выдаёт роль: `src/app/api/auth/workspace/route.ts`, `src/lib/user-experience/workspaces.ts`.
- ✅ Статический просмотр 70 admin route files не нашёл endpoint без проверки `authorizeAdminRequest` либо собственного session/capability guard; `/api/admin/session` отдельно проверяет staff.
- ⚠️ Не выполнена полная capability-матрица по каждому методу и объекту; наличие guard не доказывает правильность требуемой capability.
- ⚠️ Самостоятельное добавление роли organizer разрешено схемой и кодом. Это соответствует текущему продукту, но organizer verification и доступ к чужим заявкам должны проверяться отдельной матрицей.

### RLS and data isolation

- ✅ Read-only static audit: 84 public tables, 0 таблиц без объявленного RLS/policy.
- ✅ Service-role-only OTP tables явно revoke-доступны anon/authenticated/public.
- ⚠️ Проверка структурная, не семантическая: SEC-012.
- ❌ RLS/RBAC можно обойти через создание admin-профиля из user metadata: SEC-001.
- ⏸ Live `pg_policies`, grants, Supabase Security Advisors и user-A/user-B matrix не запускались, чтобы не обращаться к/не менять production. Это внешний release blocker до безопасного read-only доступа к правильному проекту.

### Privacy and consent

- ❌ Delete workflow сохраняет PII после завершения: SEC-004.
- ❌ Attribution пишется до consent: SEC-006.
- ⚠️ Export owner-authenticated, но неполный: SEC-014.
- ✅ Delete request owner-authenticated, имеет очередь approval/processing/failure; processor блокирует Auth user и отзывает sessions перед анонимизацией.
- ⚠️ Операция не транзакционна между Auth, profile, bookings и request status. Частичный сбой помечается `failed`, но возможен промежуточный заблокированный/частично анонимизированный аккаунт; нужен idempotent retry test.
- ✅ Analytics, GTM, Yandex Metrika, Vercel Analytics и Speed Insights монтируются только при `analytics=true`; product events также проверяют consent.
- ✅ Analytics и personalization разделены; отзыв analytics вызывает reload и останавливает дальнейшие client events.
- ⚠️ Нет consent version/expiry: SEC-007.
- ⚠️ Не выполнен clean-browser network test «до согласия / accept / withdraw» и keyboard/CTA overlay test; unit tests покрывают только helper-логику.

### Headers, XSS, secrets, dependencies

- ✅ Production отдаёт HSTS, `SAMEORIGIN`, `nosniff`, strict-origin referrer policy и ограниченную Permissions-Policy.
- ❌ CSP отсутствует: SEC-010.
- ✅ Простой scan tracked-файлов не нашёл private keys, `sk_live`, `sb_secret` или service-role JWT; отслеживается только `.env.example`.
- ⚠️ Есть много HTML render sinks. Основные CMS/partner mappers используют `sanitizeHtml`, но полный source-to-sink XSS trace и upload validation не завершены.
- ✅ Production dependency audit не содержит high/critical.
- ⚠️ Две moderate dependency vulnerabilities остаются: SEC-011.
- ⚠️ CSRF в основном опирается на SameSite cookies; отдельные origin/token tests для чувствительных POST отсутствуют.

## Executed evidence

| Проверка | Результат |
|---|---|
| Targeted unit tests: auth flow, workspace roles, consent, GTM/product events | **5 files / 16 tests passed** |
| Read-only static RLS audit | **84 tables / 0 structural issues** |
| `npm run auth:readiness` | **OK**, expected project ref; canonical URL missing in current shell |
| `npm audit --omit=dev --json` | **0 critical, 0 high, 2 moderate** |
| Tracked secret-pattern scan | No matching committed secret material |
| Production security header `HEAD` | 200; HSTS/frame/nosniff/referrer/permissions present; CSP absent |

Existing E2E tests cover mobile auth layout, expired recovery link, reset cooldown, recovery-session requirement and neutral booking lookup. Они **не запускались в этом аудите**, потому что local env может быть связан с production, а booking lookup создаёт challenge/audit rows и reset может отправить письмо.

## Required re-test before release

1. Исправить SEC-001 отдельной reviewed migration и серверным изменением; сначала read-only найти профили с admin без доверенного назначения.
2. Убрать enumeration и PII из lookup/login (SEC-002, SEC-003); добавить API timing/body regression.
3. Сделать OTP verify атомарным (SEC-005) и запустить конкурентные replay/expiry/attempt tests на локальной или staging БД.
4. Исправить privacy retention (SEC-004), затем проверить idempotent delete/retry и полный export на синтетическом staging user.
5. Подчинить attribution согласию и добавить version/expiry (SEC-006, SEC-007); выполнить clean-browser network/storage acceptance.
6. На правильном Supabase project ref выполнить **только read-only**: Security Advisors, `pg_policies`, grants/functions audit и role matrix. Никаких исправлений напрямую в production без миграции и rollback.
7. После локального/staging pass проверить production recovery вручную владельцем: письмо → одноразовая ссылка → новый пароль → старые sessions недействительны → новый вход. Не использовать общий пароль в отчётах/логах.
8. Добавить CSP report-only, устранить dependency advisory и прогнать полный security/release gate.

## Release decision

**NO-GO.** Есть подтверждённый P0 privilege escalation и пять P1 по account disclosure, privacy, OTP replay и consent. Зелёный structural RLS audit и успешные unit tests не компенсируют эти блокеры. Перевести статус в GO можно только после исправлений, миграционного review, staging adversarial tests и read-only live verification правильного Supabase-проекта.
