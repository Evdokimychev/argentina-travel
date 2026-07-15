-- Emergency rollback for 20260715041742_content_knowledge_governance.sql.
-- Back up the governance tables before running. Existing content_documents and
-- cms_media_assets data is preserved; only additive columns are removed last.

drop trigger if exists content_documents_publication_gate_insert on public.content_documents;
drop trigger if exists content_documents_publication_gate_update on public.content_documents;
drop function if exists public.enforce_content_publication_gate();
drop function if exists public.content_publication_gate(text);

drop table if exists public.content_media_usages;
drop table if exists public.content_widget_usages;
drop table if exists public.content_widget_registry;
drop table if exists public.entity_relations;
drop table if exists public.dynamic_facts;
drop table if exists public.knowledge_claims;
drop table if exists public.content_source_links;
drop table if exists public.content_sources;

delete from public.feature_flags where key = 'content_governance_v1';

alter table public.cms_media_assets
  drop column if exists original_url,
  drop column if exists source_platform,
  drop column if exists source_page_url,
  drop column if exists creator,
  drop column if exists creator_profile_url,
  drop column if exists license,
  drop column if exists license_url,
  drop column if exists attribution_text,
  drop column if exists accessed_at,
  drop column if exists rights_verified_at,
  drop column if exists rights_verified_by,
  drop column if exists location_entity_id,
  drop column if exists capture_date,
  drop column if exists caption_ru,
  drop column if exists focal_point,
  drop column if exists content_hash,
  drop column if exists rights_status;

alter table public.content_documents
  drop column if exists workflow_stage,
  drop column if exists risk_level,
  drop column if exists reviewer_id,
  drop column if exists last_fact_checked_at,
  drop column if exists next_review_at,
  drop column if exists last_substantive_update_at,
  drop column if exists schema_version;
