begin;

delete from storage.objects where bucket_id = 'ingestion-raw';
delete from storage.buckets where id = 'ingestion-raw';

drop table if exists public.ingestion_migration_ledger cascade;
drop table if exists public.ingestion_prompt_versions cascade;
drop table if exists public.ingestion_processing_steps cascade;
drop table if exists public.ingestion_duplicate_links cascade;
drop table if exists public.ingestion_candidates cascade;
drop table if exists public.ingestion_normalized_documents cascade;
drop table if exists public.ingestion_raw_documents cascade;
drop table if exists public.ingestion_source_runs cascade;
drop table if exists public.ingestion_sources cascade;

commit;
