-- Tripster experience reviews (synced subset for public display)
create table if not exists public.tripster_reviews (
  id bigint primary key,
  experience_id integer not null references public.tripster_experiences (id) on delete cascade,
  rating numeric(3, 1),
  author_name text,
  review_text text,
  created_at timestamptz,
  payload jsonb not null default '{}'::jsonb,
  synced_at timestamptz not null default now()
);

create index if not exists tripster_reviews_experience_id_idx on public.tripster_reviews (experience_id);
create index if not exists tripster_reviews_created_at_idx on public.tripster_reviews (created_at desc nulls last);

alter table public.tripster_reviews enable row level security;

drop policy if exists "tripster_reviews_select_public" on public.tripster_reviews;
create policy "tripster_reviews_select_public"
  on public.tripster_reviews for select
  to anon, authenticated
  using (true);
