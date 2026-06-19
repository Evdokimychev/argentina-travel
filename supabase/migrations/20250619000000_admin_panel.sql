-- Phase E1: Admin panel foundation — staff, audit, moderation, settings
-- Apply via: npm run supabase:migrate

-- ---------------------------------------------------------------------------
-- Role presets (reference data)
-- ---------------------------------------------------------------------------
create table if not exists public.admin_role_presets (
  id text primary key,
  label text not null,
  description text,
  capabilities text[] not null default '{}',
  created_at timestamptz not null default now()
);

insert into public.admin_role_presets (id, label, description, capabilities)
values
  (
    'super_admin',
    'Суперадминистратор',
    'Полный доступ ко всем разделам',
    array['*']::text[]
  ),
  (
    'operations_manager',
    'Операции',
    'Лиды, заявки, заказы магазина',
    array['dashboard.view', 'operations.leads', 'operations.bookings', 'operations.shop']::text[]
  ),
  (
    'marketplace_manager',
    'Маркетплейс',
    'Туры, экскурсии, модерация',
    array['dashboard.view', 'marketplace.tours', 'marketplace.excursions', 'marketplace.moderation']::text[]
  ),
  (
    'content_editor',
    'Контент',
    'Статьи, путеводитель, настройки контента',
    array['dashboard.view', 'content.edit', 'content.publish']::text[]
  ),
  (
    'support_agent',
    'Поддержка',
    'Просмотр пользователей и заявок',
    array['dashboard.view', 'operations.leads', 'users.view']::text[]
  )
on conflict (id) do update set
  label = excluded.label,
  description = excluded.description,
  capabilities = excluded.capabilities;

-- ---------------------------------------------------------------------------
-- Staff assignments (granular capabilities per admin user)
-- ---------------------------------------------------------------------------
create table if not exists public.admin_staff (
  user_id text primary key references public.profiles (id) on delete cascade,
  preset text references public.admin_role_presets (id),
  capabilities text[] not null default '{}',
  is_active boolean not null default true,
  invited_by text references public.profiles (id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists admin_staff_preset_idx on public.admin_staff (preset);
create index if not exists admin_staff_active_idx on public.admin_staff (is_active) where is_active = true;

drop trigger if exists admin_staff_set_updated_at on public.admin_staff;
create trigger admin_staff_set_updated_at
  before update on public.admin_staff
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Audit log
-- ---------------------------------------------------------------------------
create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id text references public.profiles (id) on delete set null,
  action text not null,
  entity_type text,
  entity_id text,
  payload jsonb not null default '{}',
  ip_address text,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_log_created_at_idx on public.admin_audit_log (created_at desc);
create index if not exists admin_audit_log_actor_idx on public.admin_audit_log (actor_user_id);
create index if not exists admin_audit_log_entity_idx on public.admin_audit_log (entity_type, entity_id);

-- ---------------------------------------------------------------------------
-- Moderation queue (tours, reviews, organizer applications — extensible)
-- ---------------------------------------------------------------------------
create table if not exists public.moderation_queue (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id text not null,
  status text not null default 'pending',
  priority smallint not null default 0,
  submitted_by text references public.profiles (id) on delete set null,
  assigned_to text references public.profiles (id) on delete set null,
  reason text,
  metadata jsonb not null default '{}',
  resolved_at timestamptz,
  resolved_by text references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint moderation_queue_status_check check (
    status in ('pending', 'in_review', 'approved', 'rejected', 'cancelled')
  ),
  constraint moderation_queue_entity_unique unique (entity_type, entity_id)
);

create index if not exists moderation_queue_status_idx on public.moderation_queue (status, priority desc, created_at);
create index if not exists moderation_queue_assigned_idx on public.moderation_queue (assigned_to) where assigned_to is not null;

drop trigger if exists moderation_queue_set_updated_at on public.moderation_queue;
create trigger moderation_queue_set_updated_at
  before update on public.moderation_queue
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Site settings (key-value, future CMS / feature flags)
-- ---------------------------------------------------------------------------
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}',
  updated_by text references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now()
);

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Profile extensions
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists is_blocked boolean not null default false,
  add column if not exists organizer_verified_at timestamptz,
  add column if not exists admin_notes text;

-- ---------------------------------------------------------------------------
-- Tour moderation columns
-- ---------------------------------------------------------------------------
alter table public.tours
  add column if not exists moderation_status text not null default 'none',
  add column if not exists moderation_notes text,
  add column if not exists moderated_by text,
  add column if not exists moderated_at timestamptz;

alter table public.tours drop constraint if exists tours_moderation_status_check;
alter table public.tours add constraint tours_moderation_status_check check (
  moderation_status in ('none', 'pending', 'approved', 'rejected')
);

create index if not exists tours_moderation_status_idx on public.tours (moderation_status)
  where moderation_status = 'pending';

-- ---------------------------------------------------------------------------
-- RLS helper: capability check for authenticated admins
-- ---------------------------------------------------------------------------
create or replace function public.is_admin_with(required_capability text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_staff s
    join public.profiles p on p.id = s.user_id
    where s.user_id = auth.uid()::text
      and s.is_active = true
      and p.roles @> array['admin']::text[]
      and not coalesce(p.is_blocked, false)
      and (
        '*' = any(s.capabilities)
        or required_capability = any(s.capabilities)
      )
  )
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()::text
      and p.roles @> array['admin']::text[]
      and not coalesce(p.is_blocked, false)
      and not exists (
        select 1 from public.admin_staff s where s.user_id = p.id
      )
  );
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.admin_role_presets enable row level security;
alter table public.admin_staff enable row level security;
alter table public.admin_audit_log enable row level security;
alter table public.moderation_queue enable row level security;
alter table public.site_settings enable row level security;

drop policy if exists "admin_role_presets_select_staff" on public.admin_role_presets;
create policy "admin_role_presets_select_staff"
  on public.admin_role_presets for select
  to authenticated
  using (public.is_admin_with('dashboard.view'));

drop policy if exists "admin_staff_select_self_or_super" on public.admin_staff;
create policy "admin_staff_select_self_or_super"
  on public.admin_staff for select
  to authenticated
  using (
    user_id = auth.uid()::text
    or public.is_admin_with('*')
  );

drop policy if exists "admin_audit_log_select_staff" on public.admin_audit_log;
create policy "admin_audit_log_select_staff"
  on public.admin_audit_log for select
  to authenticated
  using (public.is_admin_with('system.audit'));

drop policy if exists "moderation_queue_select_staff" on public.moderation_queue;
create policy "moderation_queue_select_staff"
  on public.moderation_queue for select
  to authenticated
  using (public.is_admin_with('marketplace.moderation'));

drop policy if exists "site_settings_select_staff" on public.site_settings;
create policy "site_settings_select_staff"
  on public.site_settings for select
  to authenticated
  using (public.is_admin_with('system.settings'));

comment on table public.admin_staff is 'Granular admin capabilities; bootstrap admins without row get full access via is_admin_with()';
comment on table public.admin_audit_log is 'Immutable admin action log — writes via service role API only';
comment on table public.moderation_queue is 'Unified moderation inbox for tours, reviews, organizer applications';
