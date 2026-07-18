-- Search visibility control plane: encrypted provider credentials and
-- admin-only search performance. Search phrases are treated as sensitive
-- telemetry; secrets remain in Supabase Vault and neither is exposed through
-- public site settings or direct Data API grants.

create extension if not exists supabase_vault cascade;

create table public.seo_provider_connections (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('google_search_console', 'yandex_webmaster')),
  property_url text not null,
  credential_label text,
  vault_secret_id uuid not null,
  status text not null default 'configured'
    check (status in ('configured', 'verified', 'error')),
  last_verified_at timestamptz,
  last_synced_at timestamptz,
  last_error_code text,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider)
);

create table public.seo_search_performance_daily (
  id bigint generated always as identity primary key,
  provider text not null check (provider in ('google_search_console', 'yandex_webmaster')),
  property_url text not null,
  metric_date date not null,
  query text not null default '',
  page text not null default '',
  country text not null default '',
  device text not null default 'all',
  clicks numeric not null default 0 check (clicks >= 0),
  impressions numeric not null default 0 check (impressions >= 0),
  ctr numeric not null default 0 check (ctr >= 0 and ctr <= 1),
  position numeric not null default 0 check (position >= 0),
  fetched_at timestamptz not null default now(),
  unique (provider, property_url, metric_date, query, page, country, device)
);

create table public.seo_search_sync_runs (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('google_search_console', 'yandex_webmaster')),
  status text not null check (status in ('running', 'succeeded', 'failed')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  rows_received integer not null default 0 check (rows_received >= 0),
  rows_written integer not null default 0 check (rows_written >= 0),
  error_code text,
  triggered_by text not null default 'admin' check (triggered_by in ('admin', 'cron'))
);

create index seo_search_performance_query_idx
  on public.seo_search_performance_daily (provider, metric_date desc, impressions desc, query);
create index seo_search_performance_page_idx
  on public.seo_search_performance_daily (provider, metric_date desc, page)
  where page <> '';
create index seo_search_sync_runs_provider_idx
  on public.seo_search_sync_runs (provider, started_at desc);

alter table public.seo_provider_connections enable row level security;
alter table public.seo_search_performance_daily enable row level security;
alter table public.seo_search_sync_runs enable row level security;

revoke all on public.seo_provider_connections from anon, authenticated, public;
revoke all on public.seo_search_performance_daily from anon, authenticated, public;
revoke all on public.seo_search_sync_runs from anon, authenticated, public;
revoke usage, select on sequence public.seo_search_performance_daily_id_seq
  from anon, authenticated, public;

grant select, insert, update, delete on public.seo_provider_connections to service_role;
grant select, insert, update, delete on public.seo_search_performance_daily to service_role;
grant select, insert, update, delete on public.seo_search_sync_runs to service_role;
grant usage, select on sequence public.seo_search_performance_daily_id_seq to service_role;

create or replace function public.seo_upsert_provider_connection(
  p_provider text,
  p_property_url text,
  p_secret text,
  p_credential_label text,
  p_actor_user_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_existing public.seo_provider_connections%rowtype;
  v_secret_id uuid;
  v_row public.seo_provider_connections%rowtype;
begin
  if p_provider not in ('google_search_console', 'yandex_webmaster') then
    raise exception 'INVALID_PROVIDER';
  end if;
  if length(trim(p_property_url)) < 4 or length(trim(p_secret)) < 8 then
    raise exception 'INVALID_CREDENTIALS';
  end if;

  select * into v_existing
  from public.seo_provider_connections
  where provider = p_provider
  for update;

  if found then
    perform vault.update_secret(
      v_existing.vault_secret_id,
      p_secret,
      'seo.' || p_provider,
      'Encrypted credential for search visibility provider'
    );
    v_secret_id := v_existing.vault_secret_id;
  else
    v_secret_id := vault.create_secret(
      p_secret,
      'seo.' || p_provider,
      'Encrypted credential for search visibility provider'
    );
  end if;

  insert into public.seo_provider_connections (
    provider, property_url, credential_label, vault_secret_id,
    status, last_error_code, created_by, updated_by
  ) values (
    p_provider, trim(p_property_url), nullif(trim(p_credential_label), ''), v_secret_id,
    'configured', null, p_actor_user_id, p_actor_user_id
  )
  on conflict (provider) do update set
    property_url = excluded.property_url,
    credential_label = excluded.credential_label,
    vault_secret_id = excluded.vault_secret_id,
    status = 'configured',
    last_error_code = null,
    updated_by = excluded.updated_by,
    updated_at = now()
  returning * into v_row;

  insert into public.admin_audit_log (
    actor_user_id, action, entity_type, entity_id, payload
  ) values (
    p_actor_user_id,
    'seo_provider_connection_saved',
    'seo_provider_connection',
    v_row.id::text,
    jsonb_build_object('provider', p_provider, 'propertyUrl', trim(p_property_url))
  );

  return jsonb_build_object('id', v_row.id, 'provider', v_row.provider, 'status', v_row.status);
end;
$$;

create or replace function public.seo_delete_provider_connection(
  p_provider text,
  p_actor_user_id uuid
) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.seo_provider_connections%rowtype;
begin
  delete from public.seo_provider_connections
  where provider = p_provider
  returning * into v_row;

  if not found then
    return false;
  end if;

  delete from vault.secrets where id = v_row.vault_secret_id;
  delete from public.seo_search_performance_daily where provider = p_provider;

  insert into public.admin_audit_log (
    actor_user_id, action, entity_type, entity_id, payload
  ) values (
    p_actor_user_id,
    'seo_provider_connection_deleted',
    'seo_provider_connection',
    v_row.id::text,
    jsonb_build_object('provider', p_provider)
  );
  return true;
end;
$$;

create or replace function public.seo_get_provider_secret(p_provider text)
returns table (
  provider text,
  property_url text,
  credential_label text,
  secret_value text
)
language sql
security definer
set search_path = ''
as $$
  select c.provider, c.property_url, c.credential_label, s.decrypted_secret
  from public.seo_provider_connections c
  join vault.decrypted_secrets s on s.id = c.vault_secret_id
  where c.provider = p_provider
  limit 1;
$$;

create or replace function public.seo_search_performance_summary(p_days integer default 28)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with filtered as (
    select *
    from public.seo_search_performance_daily
    where metric_date >= current_date - greatest(1, least(coalesce(p_days, 28), 365))
  ), totals as (
    select
      coalesce(sum(clicks), 0) as clicks,
      coalesce(sum(impressions), 0) as impressions,
      case when sum(impressions) > 0 then sum(clicks) / sum(impressions) else 0 end as ctr,
      case when sum(impressions) > 0
        then sum(position * impressions) / sum(impressions)
        else null end as position
    from filtered
  ), query_rows as (
    select query, sum(clicks) clicks, sum(impressions) impressions,
      case when sum(impressions) > 0 then sum(clicks) / sum(impressions) else 0 end ctr,
      case when sum(impressions) > 0
        then sum(position * impressions) / sum(impressions)
        else 0 end position
    from filtered
    where query <> ''
    group by query
    order by impressions desc
    limit 100
  ), page_rows as (
    select page, sum(clicks) clicks, sum(impressions) impressions,
      case when sum(impressions) > 0 then sum(clicks) / sum(impressions) else 0 end ctr,
      case when sum(impressions) > 0
        then sum(position * impressions) / sum(impressions)
        else 0 end position
    from filtered
    where page <> ''
    group by page
    order by impressions desc
    limit 100
  )
  select jsonb_build_object(
    'from', (current_date - greatest(1, least(coalesce(p_days, 28), 365)))::text,
    'to', current_date::text,
    'totals', (select to_jsonb(totals) from totals),
    'queries', coalesce((select jsonb_agg(to_jsonb(query_rows)) from query_rows), '[]'::jsonb),
    'pages', coalesce((select jsonb_agg(to_jsonb(page_rows)) from page_rows), '[]'::jsonb)
  );
$$;

revoke all on function public.seo_upsert_provider_connection(text, text, text, text, uuid)
  from public, anon, authenticated;
revoke all on function public.seo_delete_provider_connection(text, uuid)
  from public, anon, authenticated;
revoke all on function public.seo_get_provider_secret(text)
  from public, anon, authenticated;
revoke all on function public.seo_search_performance_summary(integer)
  from public, anon, authenticated;
grant execute on function public.seo_upsert_provider_connection(text, text, text, text, uuid)
  to service_role;
grant execute on function public.seo_delete_provider_connection(text, uuid)
  to service_role;
grant execute on function public.seo_get_provider_secret(text)
  to service_role;
grant execute on function public.seo_search_performance_summary(integer)
  to service_role;

comment on table public.seo_provider_connections is
  'Server-only metadata for encrypted Search Console and Yandex Webmaster credentials.';
comment on table public.seo_search_performance_daily is
  'Admin-only search query/page metrics retained by the server; search phrases are sensitive telemetry and contain no provider credentials.';
comment on function public.seo_get_provider_secret(text) is
  'Service-role-only credential read from Supabase Vault. Never expose to a browser response.';
