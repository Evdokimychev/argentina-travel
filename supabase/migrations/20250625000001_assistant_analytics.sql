-- E68: Guide assistant analytics event

drop policy if exists "analytics_events_anon_insert" on public.analytics_events;
create policy "analytics_events_anon_insert"
  on public.analytics_events
  for insert
  to anon, authenticated
  with check (event_type in ('tour_view', 'booking_started', 'assistant_ask'));

comment on column public.analytics_events.event_type is
  'tour_view | booking_started | assistant_ask (E68)';
