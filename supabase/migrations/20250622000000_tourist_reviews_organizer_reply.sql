-- E22: Organizer reply to published tourist reviews
-- Apply via: npm run supabase:migrate

alter table public.tourist_reviews
  add column if not exists organizer_reply text,
  add column if not exists organizer_replied_at timestamptz,
  add column if not exists organizer_replied_by uuid references public.profiles (id) on delete set null;
