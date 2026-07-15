-- Stage 2: non-destructive editorial overrides for public map objects.

create table if not exists public.map_object_curation (
  object_id text primary key,
  latitude double precision,
  longitude double precision,
  importance smallint not null default 50 check (importance between 0 and 100),
  featured boolean not null default false,
  editorial_priority smallint not null default 50 check (editorial_priority between 0 and 100),
  quality_score smallint not null default 50 check (quality_score between 0 and 100),
  source text,
  source_url text,
  source_verified_at date,
  min_zoom numeric(4, 1) not null default 3 check (min_zoom between 0 and 22),
  max_zoom numeric(4, 1) not null default 18 check (max_zoom between 0 and 22),
  region text,
  tags text[] not null default '{}',
  status text not null default 'published' check (status in ('published', 'hidden', 'needs_review')),
  curator_note text,
  related_article_href text,
  related_tour_href text,
  related_airport_iata text,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (min_zoom <= max_zoom)
);

comment on table public.map_object_curation is
  'Owner-managed editorial overrides for ranked map objects; source objects remain intact.';

alter table public.map_object_curation enable row level security;

drop policy if exists "map_object_curation_service_all" on public.map_object_curation;
create policy "map_object_curation_service_all"
  on public.map_object_curation
  for all
  to service_role
  using (true)
  with check (true);

insert into public.feature_flags (key, enabled, rollout_percent, metadata)
values
  ('role_workspace_v2', true, 100, '{"description":"Role-aware active workspace"}'::jsonb),
  ('page_intro_v2', true, 100, '{"description":"Shared page hierarchy"}'::jsonb),
  ('owner_dashboard_v2', true, 100, '{"description":"Task-oriented owner dashboard"}'::jsonb),
  ('cms_editor_v2', true, 100, '{"description":"Owner-oriented CMS information architecture"}'::jsonb),
  ('organizer_articles_v2', true, 100, '{"description":"Reliable organizer article workflow"}'::jsonb),
  ('map_curation_v2', true, 100, '{"description":"Ranked and curated map objects"}'::jsonb),
  ('flights_mobile_v2', true, 100, '{"description":"Responsive flights partner widget"}'::jsonb),
  ('analytics_taxonomy_v2', true, 100, '{"description":"Privacy-safe product event taxonomy"}'::jsonb)
on conflict (key) do nothing;
