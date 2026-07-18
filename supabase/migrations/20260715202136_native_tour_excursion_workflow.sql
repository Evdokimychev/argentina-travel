-- Native organizer tours and excursions share the canonical tours table while
-- remaining independently queryable in the public catalogs.

alter table public.tours
  add column if not exists product_type text not null default 'tour',
  add column if not exists editor_draft jsonb,
  add column if not exists approved_listing jsonb,
  add column if not exists approved_payload jsonb,
  add column if not exists approved_at timestamptz;

update public.tours
set product_type = case
  when payload ->> 'type' = 'excursion' then 'excursion'
  else 'tour'
end;

update public.tours
set
  approved_listing = coalesce(approved_listing, listing),
  approved_payload = coalesce(approved_payload, payload),
  approved_at = coalesce(approved_at, moderated_at, published_at, updated_at)
where status = 'published'
  and moderation_status in ('none', 'approved');

alter table public.tours drop constraint if exists tours_product_type_check;
alter table public.tours add constraint tours_product_type_check
  check (product_type in ('tour', 'excursion'));

create index if not exists tours_product_catalog_idx
  on public.tours (product_type, status, moderation_status, published_at desc nulls last);

create index if not exists tours_owner_product_updated_idx
  on public.tours (owner_user_id, product_type, updated_at desc);

comment on column public.tours.product_type is
  'Native organizer product kind: tour or excursion';
comment on column public.tours.editor_draft is
  'Exact organizer editor state used for cross-device draft recovery';
comment on column public.tours.approved_payload is
  'Last approved public version kept live while organizer edits are moderated';

-- Public catalog reads go through server-only repositories. Keeping direct
-- Data API access here would expose canonical payload and editor_draft columns.
drop policy if exists "tours_select_published" on public.tours;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'organizer-products',
  'organizer-products',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "organizer_products_select_public" on storage.objects;
create policy "organizer_products_select_public"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'organizer-products');

drop policy if exists "organizer_products_insert_own" on storage.objects;
create policy "organizer_products_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'organizer-products'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "organizer_products_update_own" on storage.objects;
create policy "organizer_products_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'organizer-products'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'organizer-products'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "organizer_products_delete_own" on storage.objects;
create policy "organizer_products_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'organizer-products'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
