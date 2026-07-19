# Шаблон: Supabase migration

## Путь

Создавать только штатной командой, чтобы имя и timestamp не конфликтовали:

```bash
npx supabase migration new descriptive_name
```

## Чеклист

- [ ] `ENABLE ROW LEVEL SECURITY`
- [ ] Явно отозваны legacy/default grants, которые не нужны (`REVOKE`)
- [ ] Есть минимальные explicit `GRANT` для `anon`, `authenticated`, `service_role` — RLS не заменяет table privileges
- [ ] Policies для нужных ролей содержат ownership/capability predicate; `TO authenticated` само по себе не является авторизацией
- [ ] Для `UPDATE` есть и `USING`, и `WITH CHECK`; также существует нужная `SELECT` policy
- [ ] Indexes для FK и частых filters
- [ ] Comment на таблице/колонке если non-obvious
- [ ] Backward compatible (nullable columns first)
- [ ] View использует `security_invoker=true` либо закрыта от Data API
- [ ] Для функций явно заданы `SECURITY INVOKER`/обоснованный `SECURITY DEFINER`, безопасный `search_path` и `REVOKE EXECUTE FROM PUBLIC`
- [ ] Domain/Supabase types синхронизированы после изменения схемы

Новые проекты Supabase не обязаны автоматически открывать таблицы Data API. Поэтому migration должна явно описывать оба слоя доступа: table grants и RLS policies. Не копировать широкие legacy grants production-схемы.

## После migration

```bash
# Сначала только отдельный staging target, project ref проверен вручную/guard-скриптом
npm run supabase:migrate
npm run supabase:verify
npm run rls-audit
node scripts/write-migration-meta.mjs
```

Для новой таблицы дополнительно проверить роли `anon`, user A, user B, organizer A/B, limited/full admin и `service_role`, а также отсутствие прямого обхода rate-limited API.

## Rollback plan

Document manual rollback SQL in migration comment or DECISIONS.md.
