-- Booking ownership must rely on immutable auth/user identifiers, never on the
-- editable profiles.email field. Guest bookings are attached through a
-- verified auth.users email in a narrow security-definer function.

drop policy if exists "bookings_select_owner" on public.bookings;
create policy "bookings_select_owner"
  on public.bookings for select
  to authenticated
  using (
    user_id = auth.uid()
    or organizer_user_id = auth.uid()::text
  );

-- All booking mutations go through server-authorized routes or narrow RPCs.
-- Removing the broad row update policy prevents tourists from changing price,
-- payment state, ownership or organizer fields through the Data API.
drop policy if exists "bookings_update_owner" on public.bookings;

create or replace function public.attach_guest_bookings_to_current_user()
returns integer
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_verified_email text;
  v_attached integer := 0;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select lower(u.email)
    into v_verified_email
    from auth.users u
   where u.id = v_user_id
     and u.email_confirmed_at is not null;

  if v_verified_email is null or v_verified_email = '' then
    return 0;
  end if;

  update public.bookings
     set user_id = v_user_id,
         guest_user_id = null,
         updated_at = now()
   where user_id is null
     and lower(contact_email) = v_verified_email;

  get diagnostics v_attached = row_count;
  return v_attached;
end;
$$;

revoke all on function public.attach_guest_bookings_to_current_user() from public;
revoke all on function public.attach_guest_bookings_to_current_user() from anon;
grant execute on function public.attach_guest_bookings_to_current_user() to authenticated;

comment on function public.attach_guest_bookings_to_current_user() is
  'Idempotently attaches guest bookings using the current confirmed auth.users email.';
