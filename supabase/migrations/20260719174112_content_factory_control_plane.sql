-- Reusable content factory + social channel control plane.
-- All operational tables are server-only. Admin access is mediated by
-- authenticated Next.js routes and every credential remains in Supabase Vault.

create extension if not exists supabase_vault cascade;

create table public.social_channel_connections (
  id uuid primary key default gen_random_uuid(),
  project_key text not null default 'argentina-travel'
    check (project_key ~ '^[a-z0-9][a-z0-9_-]{1,63}$'),
  provider text not null check (provider in ('telegram', 'instagram', 'whatsapp')),
  label text not null,
  external_account_id text,
  handle text,
  status text not null default 'configured'
    check (status in ('configured', 'verified', 'error', 'disconnected')),
  capabilities text[] not null default '{}',
  config jsonb not null default '{}',
  last_verified_at timestamptz,
  last_used_at timestamptz,
  last_error_code text,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_key, provider)
);

create table public.social_channel_secrets (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.social_channel_connections(id) on delete cascade,
  secret_name text not null check (
    secret_name in ('bot_token', 'access_token', 'app_secret', 'webhook_verify_token')
  ),
  vault_secret_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (connection_id, secret_name),
  unique (vault_secret_id)
);

create table public.content_factory_items (
  id uuid primary key default gen_random_uuid(),
  project_key text not null default 'argentina-travel'
    check (project_key ~ '^[a-z0-9][a-z0-9_-]{1,63}$'),
  source_document_id text references public.content_documents(id) on delete set null,
  title text not null check (char_length(trim(title)) between 2 and 240),
  brief text not null default '' check (char_length(brief) <= 5000),
  audience text not null default 'Путешественники по Аргентине',
  content_pillar text not null default 'Практическая Аргентина',
  goal text not null default 'Польза и доверие',
  status text not null default 'draft' check (
    status in ('idea', 'draft', 'review', 'approved', 'scheduled', 'published', 'archived')
  ),
  priority smallint not null default 2 check (priority between 0 and 3),
  scheduled_at timestamptz,
  published_at timestamptz,
  metadata jsonb not null default '{}',
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.content_factory_variants (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.content_factory_items(id) on delete cascade,
  channel text not null check (channel in ('site', 'telegram', 'instagram', 'whatsapp')),
  format text not null default 'post' check (
    format in ('article', 'post', 'carousel', 'reel', 'story', 'message', 'template')
  ),
  body text not null default '' check (char_length(body) <= 60000),
  media_urls text[] not null default '{}',
  link_url text,
  target text,
  status text not null default 'draft' check (
    status in ('draft', 'ready', 'scheduled', 'publishing', 'published', 'failed', 'archived')
  ),
  provider_options jsonb not null default '{}',
  published_at timestamptz,
  external_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (item_id, channel)
);

create table public.content_publication_jobs (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.content_factory_variants(id) on delete cascade,
  connection_id uuid references public.social_channel_connections(id) on delete restrict,
  idempotency_key uuid not null default gen_random_uuid(),
  status text not null default 'pending' check (
    status in ('pending', 'processing', 'retry', 'succeeded', 'failed', 'canceled')
  ),
  scheduled_for timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  attempt_count smallint not null default 0 check (attempt_count between 0 and 10),
  max_attempts smallint not null default 3 check (max_attempts between 1 and 10),
  external_publication_id text,
  external_url text,
  error_code text,
  error_summary text,
  response_metadata jsonb not null default '{}',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (idempotency_key)
);

create table public.social_inbox_threads (
  id uuid primary key default gen_random_uuid(),
  project_key text not null default 'argentina-travel',
  connection_id uuid not null references public.social_channel_connections(id) on delete cascade,
  provider text not null check (provider in ('telegram', 'instagram', 'whatsapp')),
  external_user_id text not null,
  display_name text,
  contact_phone text,
  status text not null default 'open' check (status in ('open', 'waiting', 'closed', 'spam')),
  unread_count integer not null default 0 check (unread_count >= 0),
  last_message_preview text,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (connection_id, external_user_id)
);

create table public.social_inbox_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.social_inbox_threads(id) on delete cascade,
  external_message_id text not null,
  direction text not null check (direction in ('inbound', 'outbound')),
  message_type text not null default 'text',
  body text not null default '' check (char_length(body) <= 60000),
  media jsonb not null default '[]',
  delivery_status text not null default 'received' check (
    delivery_status in ('queued', 'sent', 'delivered', 'read', 'received', 'failed')
  ),
  provider_timestamp timestamptz,
  raw_event jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique (thread_id, external_message_id)
);

create index social_connections_status_idx
  on public.social_channel_connections (project_key, status, provider);
create index content_factory_items_status_idx
  on public.content_factory_items (project_key, status, scheduled_at, updated_at desc);
create index content_factory_variants_item_idx
  on public.content_factory_variants (item_id, channel);
create index content_publication_jobs_due_idx
  on public.content_publication_jobs (scheduled_for, created_at)
  where status in ('pending', 'retry');
create index content_publication_jobs_variant_idx
  on public.content_publication_jobs (variant_id, created_at desc);
create unique index content_publication_jobs_one_active_variant_idx
  on public.content_publication_jobs (variant_id)
  where status in ('pending', 'processing', 'retry');
create index social_inbox_threads_recent_idx
  on public.social_inbox_threads (project_key, status, last_message_at desc);
create index social_inbox_messages_thread_idx
  on public.social_inbox_messages (thread_id, created_at);

create or replace function public.content_factory_touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger social_channel_connections_touch_updated_at
  before update on public.social_channel_connections
  for each row execute function public.content_factory_touch_updated_at();
create trigger social_channel_secrets_touch_updated_at
  before update on public.social_channel_secrets
  for each row execute function public.content_factory_touch_updated_at();
create trigger content_factory_items_touch_updated_at
  before update on public.content_factory_items
  for each row execute function public.content_factory_touch_updated_at();
create trigger content_factory_variants_touch_updated_at
  before update on public.content_factory_variants
  for each row execute function public.content_factory_touch_updated_at();
create trigger content_publication_jobs_touch_updated_at
  before update on public.content_publication_jobs
  for each row execute function public.content_factory_touch_updated_at();
create trigger social_inbox_threads_touch_updated_at
  before update on public.social_inbox_threads
  for each row execute function public.content_factory_touch_updated_at();

alter table public.social_channel_connections enable row level security;
alter table public.social_channel_secrets enable row level security;
alter table public.content_factory_items enable row level security;
alter table public.content_factory_variants enable row level security;
alter table public.content_publication_jobs enable row level security;
alter table public.social_inbox_threads enable row level security;
alter table public.social_inbox_messages enable row level security;

create policy social_channel_connections_service_role_all
  on public.social_channel_connections for all to service_role
  using (true) with check (true);
create policy social_channel_secrets_service_role_all
  on public.social_channel_secrets for all to service_role
  using (true) with check (true);
create policy content_factory_items_service_role_all
  on public.content_factory_items for all to service_role
  using (true) with check (true);
create policy content_factory_variants_service_role_all
  on public.content_factory_variants for all to service_role
  using (true) with check (true);
create policy content_publication_jobs_service_role_all
  on public.content_publication_jobs for all to service_role
  using (true) with check (true);
create policy social_inbox_threads_service_role_all
  on public.social_inbox_threads for all to service_role
  using (true) with check (true);
create policy social_inbox_messages_service_role_all
  on public.social_inbox_messages for all to service_role
  using (true) with check (true);

revoke all on public.social_channel_connections from public, anon, authenticated;
revoke all on public.social_channel_secrets from public, anon, authenticated;
revoke all on public.content_factory_items from public, anon, authenticated;
revoke all on public.content_factory_variants from public, anon, authenticated;
revoke all on public.content_publication_jobs from public, anon, authenticated;
revoke all on public.social_inbox_threads from public, anon, authenticated;
revoke all on public.social_inbox_messages from public, anon, authenticated;

grant select, insert, update, delete on public.social_channel_connections to service_role;
grant select, insert, update, delete on public.social_channel_secrets to service_role;
grant select, insert, update, delete on public.content_factory_items to service_role;
grant select, insert, update, delete on public.content_factory_variants to service_role;
grant select, insert, update, delete on public.content_publication_jobs to service_role;
grant select, insert, update, delete on public.social_inbox_threads to service_role;
grant select, insert, update, delete on public.social_inbox_messages to service_role;

create or replace function public.content_factory_upsert_connection(
  p_project_key text,
  p_provider text,
  p_label text,
  p_external_account_id text,
  p_handle text,
  p_config jsonb,
  p_secret_values jsonb,
  p_actor_user_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_connection public.social_channel_connections%rowtype;
  v_secret_name text;
  v_secret_value text;
  v_existing public.social_channel_secrets%rowtype;
  v_secret_id uuid;
  v_allowed_secret_names text[] := array['bot_token', 'access_token', 'app_secret', 'webhook_verify_token'];
begin
  if p_provider not in ('telegram', 'instagram', 'whatsapp') then
    raise exception 'INVALID_PROVIDER';
  end if;
  if p_project_key !~ '^[a-z0-9][a-z0-9_-]{1,63}$' or length(trim(p_label)) < 2 then
    raise exception 'INVALID_CONNECTION';
  end if;

  insert into public.social_channel_connections (
    project_key, provider, label, external_account_id, handle, config,
    status, last_error_code, created_by, updated_by
  ) values (
    p_project_key, p_provider, trim(p_label), nullif(trim(p_external_account_id), ''),
    nullif(trim(p_handle), ''), coalesce(p_config, '{}'::jsonb),
    'configured', null, p_actor_user_id, p_actor_user_id
  ) on conflict (project_key, provider) do update set
    label = excluded.label,
    external_account_id = excluded.external_account_id,
    handle = excluded.handle,
    config = excluded.config,
    status = 'configured',
    last_error_code = null,
    updated_by = excluded.updated_by
  returning * into v_connection;

  for v_secret_name, v_secret_value in
    select key, value from jsonb_each_text(coalesce(p_secret_values, '{}'::jsonb))
  loop
    if not (v_secret_name = any(v_allowed_secret_names)) then
      raise exception 'INVALID_SECRET_NAME';
    end if;
    if length(trim(v_secret_value)) < 8 or length(v_secret_value) > 100000 then
      raise exception 'INVALID_SECRET_VALUE';
    end if;

    select * into v_existing
    from public.social_channel_secrets
    where connection_id = v_connection.id and secret_name = v_secret_name
    for update;

    if found then
      perform vault.update_secret(
        v_existing.vault_secret_id,
        v_secret_value,
        'content_factory.' || p_project_key || '.' || p_provider || '.' || v_secret_name,
        'Encrypted social channel credential'
      );
      v_secret_id := v_existing.vault_secret_id;
    else
      v_secret_id := vault.create_secret(
        v_secret_value,
        'content_factory.' || p_project_key || '.' || p_provider || '.' || v_secret_name,
        'Encrypted social channel credential'
      );
      insert into public.social_channel_secrets (connection_id, secret_name, vault_secret_id)
      values (v_connection.id, v_secret_name, v_secret_id);
    end if;
  end loop;

  return jsonb_build_object('id', v_connection.id, 'provider', v_connection.provider, 'status', v_connection.status);
end;
$$;

create or replace function public.content_factory_get_connection_credentials(
  p_provider text,
  p_project_key text default 'argentina-travel'
) returns table (
  connection_id uuid,
  provider text,
  external_account_id text,
  handle text,
  config jsonb,
  secrets jsonb
)
language sql
security definer
set search_path = ''
as $$
  select
    c.id,
    c.provider,
    c.external_account_id,
    c.handle,
    c.config,
    coalesce(jsonb_object_agg(s.secret_name, d.decrypted_secret)
      filter (where s.secret_name is not null), '{}'::jsonb)
  from public.social_channel_connections c
  left join public.social_channel_secrets s on s.connection_id = c.id
  left join vault.decrypted_secrets d on d.id = s.vault_secret_id
  where c.provider = p_provider
    and c.project_key = p_project_key
    and c.status <> 'disconnected'
  group by c.id
  limit 1;
$$;

revoke all on function public.content_factory_touch_updated_at() from public, anon, authenticated;
revoke all on function public.content_factory_upsert_connection(text, text, text, text, text, jsonb, jsonb, uuid)
  from public, anon, authenticated;
revoke all on function public.content_factory_get_connection_credentials(text, text)
  from public, anon, authenticated;
grant execute on function public.content_factory_upsert_connection(text, text, text, text, text, jsonb, jsonb, uuid)
  to service_role;
grant execute on function public.content_factory_get_connection_credentials(text, text)
  to service_role;

comment on table public.content_factory_items is
  'Reusable source item: one editorial idea with channel-specific variants.';
comment on table public.content_publication_jobs is
  'Durable outbox for idempotent scheduled publishing to external channels.';
comment on table public.social_channel_secrets is
  'Server-only references to encrypted credentials in Supabase Vault; never expose through browser APIs.';
comment on table public.social_inbox_messages is
  'Signed webhook messages for the owner omnichannel inbox, deduplicated by provider message id.';
