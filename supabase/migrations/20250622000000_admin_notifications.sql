-- Phase E25: in-app admin notifications center
-- Apply via: npm run supabase:migrate

create table if not exists public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  title text not null,
  body text not null,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'
);

create index if not exists admin_notifications_created_at_idx
  on public.admin_notifications (created_at desc);

create index if not exists admin_notifications_unread_idx
  on public.admin_notifications (created_at desc)
  where read_at is null;

create unique index if not exists admin_notifications_entity_dedupe_idx
  on public.admin_notifications (
    type,
    coalesce(metadata ->> 'entity_type', ''),
    coalesce(metadata ->> 'entity_id', '')
  )
  where metadata ? 'entity_type' and metadata ? 'entity_id';

alter table public.admin_notifications enable row level security;

drop policy if exists "admin_notifications_select_staff" on public.admin_notifications;
create policy "admin_notifications_select_staff"
  on public.admin_notifications for select
  to authenticated
  using (public.is_admin_with('dashboard.view'));

drop policy if exists "admin_notifications_update_staff" on public.admin_notifications;
create policy "admin_notifications_update_staff"
  on public.admin_notifications for update
  to authenticated
  using (public.is_admin_with('dashboard.view'))
  with check (public.is_admin_with('dashboard.view'));

comment on table public.admin_notifications is 'In-app inbox for admin dashboard notifications';
