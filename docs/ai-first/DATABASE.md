# DATABASE

## Primary: Supabase (PostgreSQL)

- Migrations: `supabase/migrations/`
- Config: `supabase/config.toml`
- RLS: обязательна на всех user-facing tables

## Secondary: Prisma

- Schema: `prisma/schema.prisma`
- Seed: `prisma/seed.ts`, `npm run db:seed`
- Generate: `npm run db:generate` (postinstall)

## Commands

```bash
# Supabase
npm run supabase:migrate      # apply migration
npm run supabase:verify       # integrity check
npm run rls-audit             # RLS policy audit
npm run backup:schema         # backup before major changes
node scripts/write-migration-meta.mjs  # CI meta

# Prisma
npm run db:migrate
npm run db:push               # dev only
npm run supabase:seed-tours
npm run supabase:seed-cms
```

## RLS checklist (новая таблица)

1. `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
2. Policies: `anon`, `authenticated`, `service_role` as needed
3. Run `npm run rls-audit`
4. Document in migration comment

## Types

- Generated Supabase types (if used): sync after migration
- Domain types: `src/types/`, mappers in `src/lib/*/`

## Seeds

| Script | Purpose |
|--------|---------|
| `supabase-seed-tours.ts` | tour catalog |
| `seed-cms-from-ts.mjs` | CMS content |
| `places-seed.ts` | places catalog |

## Local development

1. Supabase local or remote dev project
2. Copy `.env.example` → `.env.local`
3. `npm run supabase:verify`

## Security

- Service role key — server only
- Never expose RLS-bypassing queries to client
- See [SECURITY.md](./SECURITY.md)

## Content knowledge governance

Миграция `20260715041742_content_knowledge_governance.sql` добавляет:

- workflow/risk/reviewer/review dates в `content_documents`;
- реестр `content_sources` и связи `content_source_links`;
- проверяемые `knowledge_claims`;
- expiring `dynamic_facts`;
- `entity_relations`, registry/usages виджетов и usages медиа;
- provenance, license, attribution, focal point, hash и rights status в `cms_media_assets`;
- server-only RPC `content_publication_gate` и триггер для `published`/`scheduled`.

Все новые таблицы имеют RLS и явные grants. Публично читаются только активные источники, неистёкшие verified claims, актуальные dynamic facts, активные relations и widgets. Редактирование требует capability `content.edit`; публикация остаётся за `content.publish`.

Rollback: `supabase/rollback/20260715041742_content_knowledge_governance.sql`. Перед ним требуется экспорт governance-таблиц: rollback намеренно не пытается преобразовать их обратно в плоские CMS-поля.
