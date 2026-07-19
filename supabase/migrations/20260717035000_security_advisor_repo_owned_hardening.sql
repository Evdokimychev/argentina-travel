-- Repo-owned subset of the 2026-07-17 Supabase Security Advisor findings.
--
-- Trigger functions execute as part of their registered database triggers and
-- are not application RPCs. Supabase grants EXECUTE to PUBLIC by default, so
-- make their direct-call surface explicit without changing trigger behavior.
revoke execute on function public.handle_new_user()
  from public, anon, authenticated;
grant execute on function public.handle_new_user()
  to service_role;

revoke execute on function public.protect_profile_sensitive_fields()
  from public, anon, authenticated;
grant execute on function public.protect_profile_sensitive_fields()
  to service_role;

revoke execute on function public.touch_conversation_thread_on_message()
  from public, anon, authenticated;
grant execute on function public.touch_conversation_thread_on_message()
  to service_role;

revoke execute on function public.touch_forum_thread_on_post()
  from public, anon, authenticated;
grant execute on function public.touch_forum_thread_on_post()
  to service_role;

-- Both buckets contain public-site media and intentionally remain public so
-- existing getPublicUrl/CDN URLs keep working. Public bucket object delivery
-- does not require a SELECT policy; SELECT below is only for authenticated
-- object listing/metadata operations.
drop policy if exists "cms_media_select_public" on storage.objects;
drop policy if exists "cms_media_select_staff" on storage.objects;
create policy "cms_media_select_staff"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'cms-media'
    and public.is_admin_with('content.edit')
  );

drop policy if exists "organizer_products_select_public" on storage.objects;
drop policy if exists "organizer_products_select_owner_or_staff" on storage.objects;
create policy "organizer_products_select_owner_or_staff"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'organizer-products'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or public.is_admin_with('content.edit')
    )
  );

comment on policy "cms_media_select_staff" on storage.objects is
  'Public URLs remain available through the public bucket; metadata listing is limited to content staff.';

comment on policy "organizer_products_select_owner_or_staff" on storage.objects is
  'Public URLs remain available through the public bucket; metadata listing is limited to the owner prefix or content staff.';
