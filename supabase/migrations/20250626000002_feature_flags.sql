-- E85: feature flags и лёгкие A/B-эксперименты

create table if not exists public.feature_flags (
  key text primary key,
  enabled boolean not null default false,
  rollout_percent smallint not null default 0
    check (rollout_percent between 0 and 100),
  metadata jsonb not null default '{}'
);

comment on table public.feature_flags is
  'Конфигурация флагов функций и процентного rollout.';

alter table public.feature_flags enable row level security;

drop policy if exists "feature_flags_service_all" on public.feature_flags;
create policy "feature_flags_service_all"
  on public.feature_flags
  for all
  to service_role
  using (true)
  with check (true);

insert into public.feature_flags (key, enabled, rollout_percent, metadata)
values
  (
    'homepage_recommendations_v2',
    false,
    0,
    '{"description":"Новый блок персональных рекомендаций на главной","variants":["control","v2"]}'::jsonb
  ),
  (
    'checkout_currency_default',
    false,
    0,
    '{"description":"Вариант валюты по умолчанию в checkout","variants":["usd","ars"]}'::jsonb
  )
on conflict (key) do nothing;
