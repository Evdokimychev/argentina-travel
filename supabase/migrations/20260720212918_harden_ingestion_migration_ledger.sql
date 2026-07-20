lock table public.ingestion_migration_ledger in access exclusive mode;

alter table public.ingestion_migration_ledger
  drop constraint ingestion_migration_ledger_identity_unique;

alter table public.ingestion_migration_ledger
  add constraint ingestion_migration_ledger_migration_identity_unique
  unique (migration_id, source_system, entity_type, legacy_id);

revoke all on public.ingestion_migration_ledger from public, anon, authenticated;
grant select, insert, update, delete on public.ingestion_migration_ledger to service_role;

do $$
begin
  if not exists (select 1 from storage.buckets where id = 'ingestion-raw' and public = false) then
    raise exception 'Expected private ingestion-raw bucket is missing or public';
  end if;
  update storage.buckets
  set allowed_mime_types = null,
      file_size_limit = 52428800
  where id = 'ingestion-raw';
end
$$;

comment on constraint ingestion_migration_ledger_migration_identity_unique
  on public.ingestion_migration_ledger is
  'Preserves a separate immutable identity namespace for every collector migration version.';
