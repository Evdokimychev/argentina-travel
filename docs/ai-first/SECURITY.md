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
