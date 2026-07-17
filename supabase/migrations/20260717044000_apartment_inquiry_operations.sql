-- Operational lifecycle for native apartment inquiries.
-- The request remains request-first: confirming it reserves dates but does not
-- create a payment, charge, or provider booking.

alter table public.apartment_inquiries
  drop constraint if exists apartment_inquiries_status_check;

update public.apartment_inquiries
set status = 'rejected'
where status = 'declined';

alter table public.apartment_inquiries
  add column if not exists row_version integer not null default 1,
  add column if not exists handled_by_user_id uuid references public.profiles(id) on delete set null,
  add column if not exists status_note text,
  add constraint apartment_inquiries_status_check
    check (status in ('awaiting_confirmation', 'in_review', 'confirmed', 'rejected', 'cancelled')),
  add constraint apartment_inquiries_row_version_positive check (row_version > 0),
  add constraint apartment_inquiries_status_note_length
    check (status_note is null or length(status_note) <= 1000);

alter table public.apartment_availability_blocks
  add column if not exists inquiry_id uuid references public.apartment_inquiries(id) on delete restrict;

create unique index if not exists apartment_availability_confirmed_inquiry_uidx
  on public.apartment_availability_blocks(inquiry_id)
  where inquiry_id is not null;

alter table public.apartment_inquiries
  add column if not exists confirmed_block_id uuid
    references public.apartment_availability_blocks(id) on delete restrict;

create index if not exists apartment_inquiries_status_created_idx
  on public.apartment_inquiries(status, created_at desc);

create index if not exists apartment_inquiries_handler_idx
  on public.apartment_inquiries(handled_by_user_id, updated_at desc)
  where handled_by_user_id is not null;

create table public.apartment_inquiry_communication_outbox (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.apartment_inquiries(id) on delete restrict,
  event_key text not null check (event_key = 'apartment_inquiry.status_changed'),
  recipient_kind text not null check (recipient_kind in ('guest', 'organizer')),
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'delivered', 'failed', 'dead')),
  payload jsonb not null default '{}'::jsonb,
  dedupe_key text not null check (length(dedupe_key) between 12 and 200),
  attempts integer not null default 0 check (attempts >= 0),
  next_attempt_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (dedupe_key, recipient_kind),
  check (not (payload ?| array['guestEmail', 'guestPhone', 'guestName', 'provider', 'apiKey', 'token']))
);

create index apartment_inquiry_communication_retry_idx
  on public.apartment_inquiry_communication_outbox(next_attempt_at, created_at)
  where status in ('pending', 'failed');

drop trigger if exists apartment_inquiry_communication_set_updated_at
  on public.apartment_inquiry_communication_outbox;
create trigger apartment_inquiry_communication_set_updated_at
  before update on public.apartment_inquiry_communication_outbox
  for each row execute function public.set_updated_at();

alter table public.apartment_inquiry_communication_outbox enable row level security;
revoke all on public.apartment_inquiry_communication_outbox from public, anon, authenticated;
grant select, insert, update, delete on public.apartment_inquiry_communication_outbox to service_role;

create or replace function public.apartment_transition_inquiry(
  p_inquiry_id uuid,
  p_expected_version integer,
  p_actor_user_id uuid,
  p_actor_is_admin boolean,
  p_next_status text,
  p_note text default null
)
returns public.apartment_inquiries
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_inquiry public.apartment_inquiries%rowtype;
  v_listing public.apartment_listings%rowtype;
  v_block public.apartment_availability_blocks%rowtype;
  v_note text := nullif(left(btrim(coalesce(p_note, '')), 1000), '');
  v_dedupe_key text;
  v_previous_status text;
  v_affected integer;
begin
  if p_actor_user_id is null then
    raise exception 'APARTMENT_INQUIRY_ACTOR_REQUIRED' using errcode = '42501';
  end if;

  if p_actor_is_admin and not exists (
    select 1
    from public.admin_staff staff
    join public.profiles profile on profile.id = staff.user_id
    where staff.user_id = p_actor_user_id
      and staff.is_active = true
      and ('*' = any(staff.capabilities) or 'marketplace.moderation' = any(staff.capabilities))
      and profile.roles @> array['admin']::text[]
      and not coalesce(profile.is_blocked, false)
  ) then
    raise exception 'APARTMENT_INQUIRY_ADMIN_REQUIRED' using errcode = '42501';
  end if;

  select * into v_inquiry
  from public.apartment_inquiries
  where id = p_inquiry_id
  for update;
  if not found then
    raise exception 'APARTMENT_INQUIRY_NOT_FOUND' using errcode = 'P0002';
  end if;

  select * into v_listing
  from public.apartment_listings
  where id = v_inquiry.apartment_id
  for update;
  if not found then
    raise exception 'APARTMENT_NOT_FOUND' using errcode = 'P0002';
  end if;

  if not p_actor_is_admin and v_listing.owner_user_id <> p_actor_user_id then
    raise exception 'APARTMENT_INQUIRY_FORBIDDEN' using errcode = '42501';
  end if;
  if v_inquiry.row_version <> p_expected_version then
    raise exception 'APARTMENT_INQUIRY_VERSION_CONFLICT' using errcode = '40001';
  end if;
  v_previous_status := v_inquiry.status;

  if not (
    (v_inquiry.status = 'awaiting_confirmation' and p_next_status in ('in_review', 'cancelled'))
    or (v_inquiry.status = 'in_review' and p_next_status in ('confirmed', 'rejected', 'cancelled'))
    or (v_inquiry.status = 'confirmed' and p_next_status = 'cancelled')
  ) then
    raise exception 'APARTMENT_INQUIRY_INVALID_TRANSITION' using errcode = '23514';
  end if;

  if p_next_status = 'confirmed' then
    insert into public.apartment_availability_blocks(
      apartment_id, stay_range, status, source, note, created_by_user_id, inquiry_id
    ) values (
      v_inquiry.apartment_id,
      v_inquiry.stay_range,
      'confirmed',
      'confirmed_inquiry',
      'Подтверждено по заявке гостя',
      p_actor_user_id,
      v_inquiry.id
    )
    returning * into v_block;
  elsif v_inquiry.status = 'confirmed' and p_next_status = 'cancelled' then
    update public.apartment_availability_blocks
    set status = 'cancelled', updated_at = now()
    where id = v_inquiry.confirmed_block_id
      and inquiry_id = v_inquiry.id
      and apartment_id = v_inquiry.apartment_id
      and source = 'confirmed_inquiry'
      and status = 'confirmed';
    get diagnostics v_affected = row_count;
    if v_affected <> 1 then
      raise exception 'APARTMENT_INQUIRY_BLOCK_INCONSISTENT' using errcode = '23514';
    end if;
  end if;

  update public.apartment_inquiries
  set status = p_next_status,
      status_note = coalesce(v_note, status_note),
      handled_by_user_id = p_actor_user_id,
      confirmed_block_id = case
        when p_next_status = 'confirmed' then v_block.id
        else confirmed_block_id
      end,
      row_version = row_version + 1,
      updated_at = now()
  where id = v_inquiry.id
  returning * into v_inquiry;

  insert into public.admin_audit_log(actor_user_id, action, entity_type, entity_id, payload)
  values (
    p_actor_user_id,
    'apartment_inquiry.' || p_next_status,
    'apartment_inquiry',
    v_inquiry.id::text,
    jsonb_build_object(
      'fromStatus', v_previous_status,
      'toStatus', p_next_status,
      'rowVersion', v_inquiry.row_version,
      'noteProvided', v_note is not null,
      'availabilityReserved', p_next_status = 'confirmed',
      'availabilityReleased', v_previous_status = 'confirmed' and p_next_status = 'cancelled'
    )
  );

  v_dedupe_key := v_inquiry.id::text || ':' || p_next_status || ':' || v_inquiry.row_version::text;
  insert into public.apartment_inquiry_communication_outbox(
    inquiry_id, event_key, recipient_kind, payload, dedupe_key
  )
  select
    v_inquiry.id,
    'apartment_inquiry.status_changed',
    recipient_kind,
    jsonb_build_object(
      'status', p_next_status,
      'apartmentTitle', v_listing.title,
      'stayStart', lower(v_inquiry.stay_range),
      'stayEnd', upper(v_inquiry.stay_range),
      'guests', v_inquiry.guests
    ),
    v_dedupe_key
  from unnest(array['guest', 'organizer']::text[]) as recipient_kind;

  return v_inquiry;
exception
  when exclusion_violation then
    raise exception 'APARTMENT_INQUIRY_DATES_UNAVAILABLE' using errcode = '23P01';
end;
$$;

revoke all on function public.apartment_transition_inquiry(uuid, integer, uuid, boolean, text, text)
  from public, anon, authenticated;
grant execute on function public.apartment_transition_inquiry(uuid, integer, uuid, boolean, text, text)
  to service_role;

comment on table public.apartment_inquiry_communication_outbox is
  'PII-free durable communication intents. A trusted worker resolves guest/organizer recipients at delivery time.';
