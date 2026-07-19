begin;

insert into public.analytics_events(event_type, ingestion_source, metadata)
values
  ('tour_view', 'controlled_server', '{}'::jsonb),
  ('tour_view', 'controlled_server', '{}'::jsonb),
  ('tour_view', 'legacy_unverified', '{}'::jsonb);

insert into public.bookings(
  id, tour_id, tour_slug, tour_title, status, contact_email, created_at
)
values
  ('analytics-booking-new', 'tour-1', 'tour-1', 'Tour 1', 'new', 'one@example.test', now()),
  ('analytics-booking-confirmed', 'tour-2', 'tour-2', 'Tour 2', 'confirmed', 'two@example.test', now()),
  ('analytics-booking-completed', 'tour-3', 'tour-3', 'Tour 3', 'completed', 'three@example.test', now());

insert into public.payment_transactions(
  booking_id, provider, external_id, amount, status, type
)
values
  ('analytics-booking-confirmed', 'manual', 'analytics-charge-1', 10, 'completed', 'charge'),
  ('analytics-booking-confirmed', 'manual', 'analytics-charge-2', 5, 'completed', 'charge'),
  ('analytics-booking-completed', 'manual', 'analytics-refund-1', 4, 'completed', 'refund');

insert into public.tourist_reviews(
  id, tour_id, tour_slug, tour_title, rating, status
)
values
  ('analytics-review-published', 'tour-1', 'tour-1', 'Tour 1', 5, 'published'),
  ('analytics-review-draft', 'tour-1', 'tour-1', 'Tour 1', 5, 'draft');

do $$
declare
  snapshot record;
  cohort_total bigint;
begin
  select * into snapshot from public.admin_analytics_funnel_counts(null);
  if snapshot.tour_views <> 2 then raise exception 'controlled tour view count mismatch'; end if;
  if snapshot.booking_started <> 3 then raise exception 'booking count mismatch'; end if;
  if snapshot.confirmed <> 2 then raise exception 'confirmed count mismatch'; end if;
  if snapshot.paid <> 1 then raise exception 'distinct ledger paid count mismatch'; end if;
  if snapshot.review <> 1 then raise exception 'published review count mismatch'; end if;

  select sum(bookings) into cohort_total from public.admin_analytics_booking_cohorts(null);
  if cohort_total <> 3 then raise exception 'cohort count mismatch'; end if;

  if has_table_privilege('anon', 'public.analytics_events', 'insert') then
    raise exception 'anon must not insert analytics events';
  end if;
  if has_table_privilege('authenticated', 'public.analytics_events', 'insert') then
    raise exception 'authenticated must not insert analytics events';
  end if;
  if has_function_privilege('anon', 'public.admin_analytics_funnel_counts(timestamptz)', 'execute') then
    raise exception 'anon must not execute admin funnel RPC';
  end if;
  if not has_function_privilege('service_role', 'public.admin_analytics_funnel_counts(timestamptz)', 'execute') then
    raise exception 'service role must execute admin funnel RPC';
  end if;
end;
$$;

set local role service_role;
select * from public.admin_analytics_funnel_counts(null);
select * from public.admin_analytics_booking_cohorts(null);
reset role;

rollback;
