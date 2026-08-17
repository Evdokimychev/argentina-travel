# SECURITY

## Secrets

- **Never commit:** `.env`, `.env.local`, API keys, service role keys
- **Server-only:** все partner tokens, `SUPABASE_SERVICE_ROLE_KEY`
- **Public OK:** `NEXT_PUBLIC_*` только для non-sensitive (site URL, anon key)

## Checklist перед merge

- [ ] Нет секретов в diff
- [ ] `npm run audit:security` (RLS + grep scan)
- [ ] Новые API routes — auth check
- [ ] User input sanitized (XSS)

## Supabase RLS

```bash
npm run rls-audit
```

Каждая таблица с user data → RLS enabled + explicit policies.

## Auth & authorization

- Supabase Auth JWT на server
- Organizer/admin routes — role verification
- RBAC: см. organizer middleware
- Organizer tour mutations — ownership check (`assertOrganizerTourOwnership`)

## CSRF / cookie-session mutations

Primary control: session cookies use **SameSite=Lax** (middleware + client setters),
so classic cross-site POSTs do not attach the auth cookie.

Defense in depth for **admin cookie-session** mutating methods
(`POST`/`PUT`/`PATCH`/`DELETE`):

- `evaluateBrowserMutationOrigin` rejects `Sec-Fetch-Site: cross-site`
- Rejects `Origin` that does not match the request URL origin
- Automation Bearer (`ADMIN_AUTOMATION_SECRET`) skips browser-origin checks
- Missing Origin/Sec-Fetch-Site is allowed (non-browser clients / unit tests);
  SameSite remains the primary control

See `src/lib/security/browser-mutation-origin.ts` and
`authorizeAdminRequest` session path.

## Payload limits

High-risk JSON mutations should check `Content-Length` (and/or stream caps):

- `rejectOversizedJsonBody` — admin finance / booking create
- `readLimitedJson` — lead capture
- Organizer draft / mobility / analytics routes keep local ceilings

Static matrix notes: `npm run security:api-matrix` → `payloadNotes` /
`bodyLimitDetected`.

## Cache privacy

Authenticated admin/organizer responses that may contain PII should set
`Cache-Control: private, no-store`. Matrix flag: `cachePrivacyNotes`.

## PII / Sentry

- `sendDefaultPii: false`
- User context: **id + role tags only** (email never set)
- Breadcrumbs/extras pass through `scrubMonitoringData`
- Admin audit payloads redact secret/token keys

## Controlled failure injection (code-side)

```bash
npm run security:failure-injection -- --list
npm run security:failure-injection -- --mode=upstash-down
npm run security:failure-injection -- --mode=webhook-replay --run-tests
```

Does not require live DB/Vercel. Live provider/DB replay remains EXTERNAL_BLOCKER.

## XSS

- React escapes by default
- `dangerouslySetInnerHTML` — только sanitized content (blog CMS)
- URL params — validate before use in links

## SQL injection

- Parameterized queries via Supabase client / Prisma
- No raw SQL with string interpolation

## Partner API

- Tokens in server env only
- Checkout URLs — validate domain (tripster.ru, youtravel.me)
- Rate limiting: [rate-limit-e87.md](../rate-limit-e87.md)

## Compliance

- [compliance-e80.md](../compliance-e80.md)
- [gdpr-automation-e95.md](../gdpr-automation-e95.md)

## Incident response

1. Rotate compromised keys in Vercel + Supabase
2. Revert bad deploy
3. Document in DECISIONS.md / incident log

## Automated checks

```bash
npm run audit:deps:production  # production supply chain, blocking
npm run audit:security   # RLS + secret patterns
npm run rls-audit
```

## Dependency audit policy

- Release gate блокирует уязвимости runtime-зависимостей через
  `npm audit --omit=dev`; на 2026-07-29 результат — 0 известных уязвимостей.
- Полный `npm audit` дополнительно отслеживается, но не подменяет production
  gate. Сейчас он показывает 9 high-записей из одной dev-only цепочки
  `ESLint → minimatch@3 → brace-expansion` (`GHSA-mh99-v99m-4gvg`).
- `npm audit fix --force` не применять: предлагаемый ESLint 10 несовместим с
  peer-контрактом `eslint-config-next@15.5.22`. Проверить исключение повторно
  при обновлении Next/lint stack или появлении совместимого upstream patch.
