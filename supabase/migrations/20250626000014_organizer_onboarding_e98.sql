-- Phase E98: organizer onboarding (application -> verification -> first tour)

create table if not exists public.organizer_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  company_name text not null,
  description text not null default '',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles (id) on delete set null,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists organizer_applications_status_idx
  on public.organizer_applications (status, created_at desc);

create index if not exists organizer_applications_user_idx
  on public.organizer_applications (user_id, created_at desc);

create unique index if not exists organizer_applications_one_pending_per_user_idx
  on public.organizer_applications (user_id)
  where status = 'pending';

drop trigger if exists organizer_applications_set_updated_at on public.organizer_applications;
create trigger organizer_applications_set_updated_at
  before update on public.organizer_applications
  for each row execute function public.set_updated_at();

comment on table public.organizer_applications is
  'Organizer onboarding applications with moderation status';

alter table public.organizer_applications enable row level security;

drop policy if exists "organizer_applications_insert_own" on public.organizer_applications;
create policy "organizer_applications_insert_own"
  on public.organizer_applications for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and status = 'pending'
    and reviewed_at is null
    and reviewed_by is null
  );

drop policy if exists "organizer_applications_select_own" on public.organizer_applications;
create policy "organizer_applications_select_own"
  on public.organizer_applications for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "organizer_applications_select_staff" on public.organizer_applications;
create policy "organizer_applications_select_staff"
  on public.organizer_applications for select
  to authenticated
  using (public.is_admin_with('marketplace.moderation'));

drop policy if exists "organizer_applications_update_staff" on public.organizer_applications;
create policy "organizer_applications_update_staff"
  on public.organizer_applications for update
  to authenticated
  using (public.is_admin_with('marketplace.moderation'))
  with check (public.is_admin_with('marketplace.moderation'));

with legacy as (
  select
    cs.id,
    p.id as user_id,
    coalesce(nullif(cs.context->>'companyName', ''), nullif(cs.name, ''), 'Организатор') as company_name,
    coalesce(nullif(cs.message, ''), '') as description,
    case
      when cs.context->>'reviewStatus' in ('approved', 'rejected') then cs.context->>'reviewStatus'
      else 'pending'
    end as status,
    case
      when coalesce(cs.context->>'reviewedAt', '') ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T'
        then (cs.context->>'reviewedAt')::timestamptz
      else null
    end as reviewed_at,
    reviewer.id as reviewed_by,
    nullif(cs.context->>'reviewNote', '') as review_note,
    cs.created_at,
    row_number() over (
      partition by p.id, case
        when cs.context->>'reviewStatus' in ('approved', 'rejected') then cs.id::text
        else 'pending'
      end
      order by cs.created_at desc
    ) as pending_rank
  from public.contact_submissions cs
  join public.profiles p
    on lower(coalesce(p.email, '')) = lower(coalesce(cs.email, ''))
  left join public.profiles reviewer
    on reviewer.id::text = nullif(cs.context->>'reviewedBy', '')
  where cs.kind = 'organizer_application'
)
insert into public.organizer_applications (
  id,
  user_id,
  company_name,
  description,
  status,
  reviewed_at,
  reviewed_by,
  review_note,
  created_at
)
select
  id,
  user_id,
  company_name,
  description,
  status,
  reviewed_at,
  reviewed_by,
  review_note,
  created_at
from legacy
where status <> 'pending' or pending_rank = 1
on conflict (id) do nothing;
