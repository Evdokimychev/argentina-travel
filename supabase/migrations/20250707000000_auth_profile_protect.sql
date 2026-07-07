-- Protect sensitive profile fields from self-escalation via RLS update policy.
-- Users may switch active_role among granted roles or add organizer once.

create or replace function public.protect_profile_sensitive_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Service role / admin API updates (no matching session uid).
  if auth.uid() is null or auth.uid() is distinct from old.id then
    return new;
  end if;

  new.is_blocked := old.is_blocked;
  new.admin_notes := old.admin_notes;
  new.organizer_verified_at := old.organizer_verified_at;
  new.deleted_at := old.deleted_at;
  new.anonymized_at := old.anonymized_at;

  if new.roles is distinct from old.roles then
    if
      not ('organizer' = any(old.roles))
      and new.roles @> old.roles
      and 'organizer' = any(new.roles)
      and not ('admin' = any(new.roles))
    then
      null;
    else
      new.roles := old.roles;
    end if;
  end if;

  if not (new.active_role = any(new.roles)) then
    new.active_role := old.active_role;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_protect_sensitive_fields on public.profiles;
create trigger profiles_protect_sensitive_fields
  before update on public.profiles
  for each row execute function public.protect_profile_sensitive_fields();

comment on function public.protect_profile_sensitive_fields() is
  'Prevents authenticated users from escalating roles or editing admin-only profile fields';
