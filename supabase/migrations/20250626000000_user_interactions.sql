-- E79: Personalization — privacy-friendly interaction log (views, favorites)

create table if not exists public.user_interactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete cascade,
  anonymous_id text,
  entity_type text not null check (entity_type in ('tour', 'excursion')),
  entity_id text not null,
  action text not null check (action in ('view', 'favorite')),
  ts timestamptz not null default now(),
  constraint user_interactions_actor_check check (
    user_id is not null
    or (anonymous_id is not null and length(trim(anonymous_id)) > 0)
  )
);

comment on table public.user_interactions is
  'Просмотры и избранное для персональных рекомендаций. Без IP и лишних метаданных.';

comment on column public.user_interactions.anonymous_id is
  'Случайный идентификатор сессии/устройства — только после согласия на cookies.';

comment on column public.user_interactions.entity_id is
  'Slug тура или экскурсии.';

create index if not exists user_interactions_user_ts_idx
  on public.user_interactions (user_id, ts desc)
  where user_id is not null;

create index if not exists user_interactions_anonymous_ts_idx
  on public.user_interactions (anonymous_id, ts desc)
  where anonymous_id is not null;

create index if not exists user_interactions_entity_idx
  on public.user_interactions (entity_type, entity_id, ts desc);

alter table public.user_interactions enable row level security;

drop policy if exists "user_interactions_insert_own" on public.user_interactions;
create policy "user_interactions_insert_own"
  on public.user_interactions
  for insert
  to anon, authenticated
  with check (
    (user_id is null and anonymous_id is not null)
    or (user_id = auth.uid())
  );

drop policy if exists "user_interactions_select_own" on public.user_interactions;
create policy "user_interactions_select_own"
  on public.user_interactions
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "user_interactions_service_all" on public.user_interactions;
create policy "user_interactions_service_all"
  on public.user_interactions
  for all
  to service_role
  using (true)
  with check (true);
