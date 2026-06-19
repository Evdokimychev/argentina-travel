-- E44: Review platform v2 — photo storage, review reports, RLS

-- ---------------------------------------------------------------------------
-- Review complaints / reports
-- ---------------------------------------------------------------------------
create table if not exists public.review_reports (
  id uuid primary key default gen_random_uuid(),
  review_id text not null references public.tourist_reviews (id) on delete cascade,
  reporter_user_id uuid references public.profiles (id) on delete set null,
  reason text not null,
  details text,
  status text not null default 'pending',
  resolved_by uuid references public.profiles (id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint review_reports_status_check check (
    status in ('pending', 'resolved', 'dismissed')
  )
);

create index if not exists review_reports_review_id_idx on public.review_reports (review_id);
create index if not exists review_reports_status_idx on public.review_reports (status, created_at desc);
create index if not exists review_reports_reporter_idx on public.review_reports (reporter_user_id);

drop trigger if exists review_reports_set_updated_at on public.review_reports;
create trigger review_reports_set_updated_at
  before update on public.review_reports
  for each row execute function public.set_updated_at();

comment on table public.review_reports is 'User complaints about published tourist reviews';

alter table public.review_reports enable row level security;

drop policy if exists "review_reports_insert_authenticated" on public.review_reports;
create policy "review_reports_insert_authenticated"
  on public.review_reports for insert
  to authenticated
  with check (reporter_user_id = auth.uid());

drop policy if exists "review_reports_select_own" on public.review_reports;
create policy "review_reports_select_own"
  on public.review_reports for select
  to authenticated
  using (reporter_user_id = auth.uid());

drop policy if exists "review_reports_select_staff" on public.review_reports;
create policy "review_reports_select_staff"
  on public.review_reports for select
  to authenticated
  using (
    exists (
      select 1 from public.admin_staff s
      where s.user_id = auth.uid() and s.is_active = true
    )
  );

drop policy if exists "review_reports_update_staff" on public.review_reports;
create policy "review_reports_update_staff"
  on public.review_reports for update
  to authenticated
  using (
    exists (
      select 1 from public.admin_staff s
      where s.user_id = auth.uid() and s.is_active = true
    )
  )
  with check (
    exists (
      select 1 from public.admin_staff s
      where s.user_id = auth.uid() and s.is_active = true
    )
  );

-- ---------------------------------------------------------------------------
-- Storage: tourist review photos
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'tourist-review-photos',
  'tourist-review-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "tourist_review_photos_select_public" on storage.objects;
create policy "tourist_review_photos_select_public"
  on storage.objects for select
  to public
  using (bucket_id = 'tourist-review-photos');

drop policy if exists "tourist_review_photos_insert_own" on storage.objects;
create policy "tourist_review_photos_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'tourist-review-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "tourist_review_photos_update_own" on storage.objects;
create policy "tourist_review_photos_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'tourist-review-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'tourist-review-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "tourist_review_photos_delete_own" on storage.objects;
create policy "tourist_review_photos_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'tourist-review-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
