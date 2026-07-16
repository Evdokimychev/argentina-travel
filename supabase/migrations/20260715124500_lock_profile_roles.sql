-- Account roles are assigned only by trusted server/admin operations.
-- Authenticated users may switch active_role only among roles already granted.
create or replace function public.protect_profile_sensitive_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Service role and trusted server operations have no matching session uid.
  if auth.uid() is null or auth.uid() is distinct from old.id then
    return new;
  end if;

  new.roles := old.roles;
  new.is_blocked := old.is_blocked;
  new.admin_notes := old.admin_notes;
  new.organizer_verified_at := old.organizer_verified_at;
  new.deleted_at := old.deleted_at;
  new.anonymized_at := old.anonymized_at;

  if not (new.active_role = any(old.roles)) then
    new.active_role := old.active_role;
  end if;

  return new;
end;
$$;

comment on function public.protect_profile_sensitive_fields() is
  'Prevents self-assignment of account roles and edits to admin-only profile fields.';
