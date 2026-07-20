begin;

lock table public.ingestion_migration_ledger in access exclusive mode;

do $$
begin
  if exists (
    select 1
    from public.ingestion_migration_ledger
    group by source_system, entity_type, legacy_id
    having count(*) > 1
  ) then
    raise exception 'Cannot restore the legacy ledger key while multiple migration versions exist';
  end if;
end
$$;

alter table public.ingestion_migration_ledger
  drop constraint ingestion_migration_ledger_migration_identity_unique;

alter table public.ingestion_migration_ledger
  add constraint ingestion_migration_ledger_identity_unique
  unique (source_system, entity_type, legacy_id);

update storage.buckets
set allowed_mime_types = array[
  'image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/plain'
],
file_size_limit = 10485760
where id = 'ingestion-raw';

commit;
