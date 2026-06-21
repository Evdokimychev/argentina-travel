-- E107: CMS media uploads (Phase A — media library upload + manifest sync)
-- Apply via: npm run supabase:migrate

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cms-media',
  'cms-media',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.cms_media_assets (
  id text primary key,
  title text not null,
  alt text not null default '',
  storage_path text not null,
  public_url text not null,
  mime_type text,
  file_size integer,
  width integer,
  height integer,
  category text not null default 'blog-article',
  tags text[] not null default '{}',
  role text not null default 'content',
  manifest_synced boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cms_media_assets_role_check check (
    role in ('hero', 'gallery', 'section', 'content', 'card', 'background', 'logo', 'thumbnail')
  )
);

create index if not exists cms_media_assets_created_idx
  on public.cms_media_assets (created_at desc);

drop trigger if exists cms_media_assets_set_updated_at on public.cms_media_assets;
create trigger cms_media_assets_set_updated_at
  before update on public.cms_media_assets
  for each row execute function public.set_updated_at();

alter table public.cms_media_assets enable row level security;

drop policy if exists "cms_media_assets_select_staff" on public.cms_media_assets;
create policy "cms_media_assets_select_staff"
  on public.cms_media_assets for select
  to authenticated
  using (public.is_admin_with('content.edit'));

drop policy if exists "cms_media_assets_insert_staff" on public.cms_media_assets;
create policy "cms_media_assets_insert_staff"
  on public.cms_media_assets for insert
  to authenticated
  with check (public.is_admin_with('content.edit'));

drop policy if exists "cms_media_assets_update_staff" on public.cms_media_assets;
create policy "cms_media_assets_update_staff"
  on public.cms_media_assets for update
  to authenticated
  using (public.is_admin_with('content.edit'))
  with check (public.is_admin_with('content.edit'));

drop policy if exists "cms_media_assets_delete_staff" on public.cms_media_assets;
create policy "cms_media_assets_delete_staff"
  on public.cms_media_assets for delete
  to authenticated
  using (public.is_admin_with('content.edit'));

drop policy if exists "cms_media_select_public" on storage.objects;
create policy "cms_media_select_public"
  on storage.objects for select
  to public
  using (bucket_id = 'cms-media');

drop policy if exists "cms_media_insert_staff" on storage.objects;
create policy "cms_media_insert_staff"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'cms-media'
    and public.is_admin_with('content.edit')
  );

drop policy if exists "cms_media_update_staff" on storage.objects;
create policy "cms_media_update_staff"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'cms-media'
    and public.is_admin_with('content.edit')
  )
  with check (
    bucket_id = 'cms-media'
    and public.is_admin_with('content.edit')
  );

drop policy if exists "cms_media_delete_staff" on storage.objects;
create policy "cms_media_delete_staff"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'cms-media'
    and public.is_admin_with('content.edit')
  );

comment on table public.cms_media_assets is 'CMS uploads — synced to media manifest via admin API';
