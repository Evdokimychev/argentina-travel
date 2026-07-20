begin;

do $$
begin
  if exists (select 1 from storage.objects where bucket_id = 'ingestion-raw') then
    raise exception 'ingestion-raw is not empty; delete objects through the Supabase Storage API before rollback';
  end if;
end
$$;

delete from storage.buckets where id = 'ingestion-raw';

update public.admin_role_presets
set capabilities = array(
  select capability
  from unnest(capabilities) as capability
  where capability <> all(array[
    'sources.view', 'sources.create', 'sources.edit', 'sources.enable',
    'sources.disable', 'sources.run', 'ingestion_runs.view',
    'ingestion_runs.retry', 'processing_queue.view', 'processing_queue.manage',
    'moderation.view', 'moderation.approve', 'moderation.reject',
    'moderation.publish', 'prompts.view', 'ingestion_audit.view'
  ]::text[])
)
where id = 'content_editor';

drop table if exists public.ingestion_migration_ledger;
drop table if exists public.ingestion_prompt_versions;
drop table if exists public.ingestion_processing_steps;
drop table if exists public.ingestion_duplicate_links;
drop table if exists public.ingestion_candidates;
drop table if exists public.ingestion_normalized_documents;
drop table if exists public.ingestion_raw_documents;
drop table if exists public.ingestion_source_runs;
drop table if exists public.ingestion_sources;

commit;
