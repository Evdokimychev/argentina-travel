-- P0 identity controls for admin user management and organizer approval.
-- The HTTP layer remains responsible for Supabase Auth ban/session calls;
-- organizer decisions and their profile grants commit atomically here.

-- Repair legacy rows before enforcing the invariant at the database boundary.
update public.profiles
set roles = array['tourist']::text[],
    active_role = 'tourist'
where cardinality(roles) = 0;

update public.profiles
set active_role = roles[1]
where not (active_role = any(roles));

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_active_role_granted_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_active_role_granted_check
      check (active_role = any(roles));
  end if;
end
$$;

create or replace function public.enforce_profile_identity_controls()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if cardinality(new.roles) = 0 then
    raise exception using
      errcode = '23514',
      message = 'PROFILE_ROLES_EMPTY';
  end if;

  if not (new.active_role = any(new.roles)) then
    raise exception using
      errcode = '23514',
      message = 'ACTIVE_ROLE_NOT_GRANTED';
  end if;

  -- Organizer access is granted only after a trusted moderation decision.
  if 'organizer' = any(new.roles)
     and not ('organizer' = any(old.roles))
     and not exists (
       select 1
       from public.organizer_applications application
       where application.user_id = new.id
         and application.status = 'approved'
     ) then
    raise exception using
      errcode = '42501',
      message = 'ORGANIZER_APPROVAL_REQUIRED';
  end if;

  -- The generic profiles API cannot create or remove the admin trust root.
  -- Staff assignment is created first and removed first by the dedicated API.
  if 'admin' = any(new.roles) and not ('admin' = any(old.roles)) then
    if not exists (
      select 1
      from public.admin_staff staff
      where staff.user_id = new.id
        and staff.is_active = true
    ) then
      raise exception using
        errcode = '42501',
        message = 'ADMIN_STAFF_ASSIGNMENT_REQUIRED';
    end if;
  elsif 'admin' = any(old.roles) and not ('admin' = any(new.roles)) then
    if exists (
      select 1
      from public.admin_staff staff
      where staff.user_id = new.id
    ) then
      raise exception using
        errcode = '42501',
        message = 'ADMIN_STAFF_REMOVAL_REQUIRED';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_profile_identity_controls() from public, anon, authenticated;
grant execute on function public.enforce_profile_identity_controls() to service_role;

drop trigger if exists profiles_enforce_identity_controls on public.profiles;
create trigger profiles_enforce_identity_controls
  before update of roles, active_role on public.profiles
  for each row execute function public.enforce_profile_identity_controls();

comment on function public.enforce_profile_identity_controls() is
  'Enforces role membership and requires approved organizer/admin assignments for privileged profile grants.';

create or replace function public.admin_decide_organizer_application(
  p_application_id uuid,
  p_actor_user_id uuid,
  p_decision text,
  p_review_note text default null,
  p_ip_address text default null
)
returns table (
  application_id uuid,
  applicant_user_id uuid,
  decision_status text,
  decided_at timestamptz,
  changed boolean
)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  application public.organizer_applications%rowtype;
  target_status text;
  decision_time timestamptz := statement_timestamp();
  profile_id uuid;
begin
  if p_decision not in ('approve', 'reject') then
    raise exception using
      errcode = '22023',
      message = 'INVALID_ORGANIZER_DECISION';
  end if;

  if p_review_note is not null and length(p_review_note) > 4000 then
    raise exception using
      errcode = '22001',
      message = 'ORGANIZER_REVIEW_NOTE_TOO_LONG';
  end if;

  if not exists (
    select 1
    from public.admin_staff staff
    join public.profiles profile on profile.id = staff.user_id
    where staff.user_id = p_actor_user_id
      and staff.is_active = true
      and profile.roles @> array['admin']::text[]
      and not coalesce(profile.is_blocked, false)
      and (
        '*' = any(staff.capabilities)
        or 'marketplace.moderation' = any(staff.capabilities)
      )
  ) then
    raise exception using
      errcode = '42501',
      message = 'ORGANIZER_DECISION_FORBIDDEN';
  end if;

  target_status := case p_decision
    when 'approve' then 'approved'
    else 'rejected'
  end;

  -- Row lock serializes competing reviewers. A repeated identical decision is
  -- an idempotent success; an opposite decision is a conflict.
  select current_application.*
  into application
  from public.organizer_applications current_application
  where current_application.id = p_application_id
  for update;

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'ORGANIZER_APPLICATION_NOT_FOUND';
  end if;

  if application.status <> 'pending' then
    if application.status = target_status then
      return query
      select
        application.id,
        application.user_id,
        application.status,
        application.reviewed_at,
        false;
      return;
    end if;

    raise exception using
      errcode = '40001',
      message = 'ORGANIZER_APPLICATION_ALREADY_DECIDED';
  end if;

  update public.organizer_applications pending_application
  set status = target_status,
      reviewed_at = decision_time,
      reviewed_by = p_actor_user_id,
      review_note = nullif(btrim(p_review_note), '')
  where pending_application.id = application.id
    and pending_application.status = 'pending';

  if not found then
    raise exception using
      errcode = '40001',
      message = 'ORGANIZER_APPLICATION_DECISION_CONFLICT';
  end if;

  if target_status = 'approved' then
    update public.profiles applicant
    set roles = case
          when 'organizer' = any(applicant.roles) then applicant.roles
          else array_append(applicant.roles, 'organizer')
        end,
        active_role = 'organizer',
        organizer_verified_at = decision_time
    where applicant.id = application.user_id
    returning applicant.id into profile_id;

    if profile_id is null then
      raise exception using
        errcode = 'P0002',
        message = 'ORGANIZER_PROFILE_NOT_FOUND';
    end if;
  end if;

  insert into public.admin_audit_log (
    actor_user_id,
    action,
    entity_type,
    entity_id,
    payload,
    ip_address
  ) values (
    p_actor_user_id,
    'organizer_application.' || p_decision,
    'organizer_application',
    application.id::text,
    jsonb_build_object(
      'decisionStatus', target_status,
      'applicantUserId', application.user_id,
      'hasReviewNote', nullif(btrim(p_review_note), '') is not null,
      'decidedAt', decision_time
    ),
    nullif(btrim(p_ip_address), '')
  );

  return query
  select
    application.id,
    application.user_id,
    target_status,
    decision_time,
    true;
end;
$$;

revoke all on function public.admin_decide_organizer_application(uuid, uuid, text, text, text)
  from public, anon, authenticated;
grant execute on function public.admin_decide_organizer_application(uuid, uuid, text, text, text)
  to service_role;

comment on function public.admin_decide_organizer_application(uuid, uuid, text, text, text) is
  'Atomically decides one pending organizer application, grants verified organizer access, and records audit evidence; service role only.';
