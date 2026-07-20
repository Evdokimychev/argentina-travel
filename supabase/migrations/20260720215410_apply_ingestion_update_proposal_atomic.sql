create or replace function public.apply_ingestion_update_proposal_atomic(
  p_proposal_id uuid,
  p_actor_id uuid,
  p_ip_address text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  proposal public.ingestion_update_proposals%rowtype;
  applied_proposal public.ingestion_update_proposals%rowtype;
  mutation_result jsonb;
  revision_id uuid;
  created_revision_number integer;
begin
  select * into proposal
  from public.ingestion_update_proposals
  where id = p_proposal_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'INGESTION_PROPOSAL_NOT_FOUND';
  end if;
  if proposal.status <> 'accepted' then
    raise exception using errcode = '40001', message = 'INGESTION_PROPOSAL_NOT_ACCEPTED';
  end if;

  mutation_result := public.cms_mutate_document_atomic(
    p_document_id => proposal.content_document_id,
    p_expected_version => proposal.base_version,
    p_actor_id => p_actor_id,
    p_operation => 'update',
    p_allow_publish => true,
    p_title => proposal.proposed_title,
    p_body => proposal.proposed_body,
    p_ip_address => p_ip_address
  );

  created_revision_number := (mutation_result ->> 'revisionNumber')::integer;
  select id into strict revision_id
  from public.content_revisions
  where document_id = proposal.content_document_id
    and revision_number = created_revision_number;

  update public.ingestion_update_proposals
  set status = 'applied',
      reviewed_by = p_actor_id,
      reviewed_at = now(),
      applied_revision_id = revision_id
  where id = p_proposal_id
    and status = 'accepted'
  returning * into applied_proposal;

  if not found then
    raise exception using errcode = '40001', message = 'INGESTION_PROPOSAL_CONCURRENT_CHANGE';
  end if;

  insert into public.admin_audit_log (
    actor_user_id, action, entity_type, entity_id, payload, ip_address
  ) values (
    p_actor_id,
    'ingestion.proposal.apply',
    'ingestion_update_proposal',
    p_proposal_id::text,
    jsonb_build_object(
      'candidateId', proposal.candidate_id,
      'contentDocumentId', proposal.content_document_id,
      'baseVersion', proposal.base_version,
      'rowVersion', mutation_result -> 'document' -> 'row_version',
      'revisionId', revision_id
    ),
    p_ip_address
  );

  return jsonb_build_object(
    'proposal', to_jsonb(applied_proposal),
    'document', mutation_result -> 'document',
    'revisionId', revision_id
  );
end;
$$;

revoke all on function public.apply_ingestion_update_proposal_atomic(uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.apply_ingestion_update_proposal_atomic(uuid, uuid, text)
  to service_role;

comment on function public.apply_ingestion_update_proposal_atomic(uuid, uuid, text) is
  'Atomically applies a human-accepted ingestion proposal, creates the CMS revision, finalizes the proposal, and records audit evidence.';
