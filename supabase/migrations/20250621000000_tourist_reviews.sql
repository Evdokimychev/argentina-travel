-- E16: Tourist reviews with admin moderation
-- Apply via: npm run supabase:migrate

create table if not exists public.tourist_reviews (
  id text primary key,
  user_id uuid references public.profiles (id) on delete set null,
  organizer_user_id text,
  organizer_tour_id text,
  tour_id text not null,
  tour_slug text not null,
  tour_title text not null,
  booking_id text,
  listing_kind text not null default 'tour',
  rating smallint not null check (rating >= 1 and rating <= 5),
  review_text text not null default '',
  photos jsonb not null default '[]'::jsonb,
  trip_date date,
  status text not null default 'draft',
  moderation_notes text,
  moderated_by uuid references public.profiles (id) on delete set null,
  moderated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tourist_reviews_status_check check (
    status in ('draft', 'pending', 'published', 'rejected')
  ),
  constraint tourist_reviews_listing_kind_check check (
    listing_kind in ('tour', 'excursion')
  )
);

create index if not exists tourist_reviews_user_id_idx on public.tourist_reviews (user_id);
create index if not exists tourist_reviews_organizer_user_id_idx on public.tourist_reviews (organizer_user_id);
create index if not exists tourist_reviews_tour_slug_idx on public.tourist_reviews (tour_slug);
create index if not exists tourist_reviews_status_idx on public.tourist_reviews (status);
create index if not exists tourist_reviews_created_at_idx on public.tourist_reviews (created_at desc);

drop trigger if exists tourist_reviews_set_updated_at on public.tourist_reviews;
create trigger tourist_reviews_set_updated_at
  before update on public.tourist_reviews
  for each row execute function public.set_updated_at();

comment on table public.tourist_reviews is 'Tourist reviews on organizer tours — moderated before public display';

alter table public.tourist_reviews enable row level security;

drop policy if exists "tourist_reviews_select_own" on public.tourist_reviews;
create policy "tourist_reviews_select_own"
  on public.tourist_reviews for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "tourist_reviews_select_published" on public.tourist_reviews;
create policy "tourist_reviews_select_published"
  on public.tourist_reviews for select
  to anon, authenticated
  using (status = 'published');

drop policy if exists "tourist_reviews_insert_own" on public.tourist_reviews;
create policy "tourist_reviews_insert_own"
  on public.tourist_reviews for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "tourist_reviews_update_own_draft" on public.tourist_reviews;
create policy "tourist_reviews_update_own_draft"
  on public.tourist_reviews for update
  to authenticated
  using (user_id = auth.uid() and status in ('draft', 'rejected'))
  with check (user_id = auth.uid() and status in ('draft', 'pending', 'rejected'));
