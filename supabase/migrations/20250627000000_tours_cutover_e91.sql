-- E91: Tours cutover — Supabase as single source of truth
-- Apply via: npm run supabase:migrate

-- Ensure published rows always carry a publication timestamp.
update public.tours
set published_at = coalesce(published_at, updated_at, created_at, now())
where status = 'published'
  and published_at is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tours_owner_user_id_not_blank_check'
      and conrelid = 'public.tours'::regclass
  ) then
    alter table public.tours
      add constraint tours_owner_user_id_not_blank_check
      check (length(btrim(owner_user_id)) > 0);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tours_published_requires_published_at_check'
      and conrelid = 'public.tours'::regclass
  ) then
    alter table public.tours
      add constraint tours_published_requires_published_at_check
      check (status <> 'published' or published_at is not null);
  end if;
end
$$;

create index if not exists tours_status_moderation_published_at_idx
  on public.tours (status, moderation_status, published_at desc nulls last);

create index if not exists tours_owner_status_updated_at_idx
  on public.tours (owner_user_id, status, updated_at desc);
