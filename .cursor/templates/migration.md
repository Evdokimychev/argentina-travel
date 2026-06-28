# Шаблон: Supabase migration

## Путь

`supabase/migrations/YYYYMMDDHHMMSS_description.sql`

## Чеклист

- [ ] `ENABLE ROW LEVEL SECURITY`
- [ ] Policies для нужных roles
- [ ] Indexes для FK и частых filters
- [ ] Comment на таблице/колонке если non-obvious
- [ ] Backward compatible (nullable columns first)

## После migration

```bash
npm run supabase:migrate
npm run supabase:verify
npm run rls-audit
node scripts/write-migration-meta.mjs
```

## Rollback plan

Document manual rollback SQL in migration comment or DECISIONS.md.
