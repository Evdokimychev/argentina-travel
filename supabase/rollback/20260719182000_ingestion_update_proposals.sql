begin;

drop table if exists public.ingestion_update_proposals cascade;

alter table public.ingestion_candidates
  drop column if exists related_content_score,
  drop column if exists related_cms_document_id;

commit;
