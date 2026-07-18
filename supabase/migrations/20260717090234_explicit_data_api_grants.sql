-- Supabase projects created after 2026-05-30 no longer expose new public
-- tables through the Data API automatically. Keep the browser/API surface
-- explicit and reproducible instead of relying on project-level defaults.

-- The mobility foundation originally enabled RLS through a catalog loop. Keep
-- these declarations explicit as well so static release checks can prove the
-- complete 121-table surface without executing arbitrary migration code.
alter table public.mobility_analytics_events enable row level security;
alter table public.mobility_fleets enable row level security;
alter table public.mobility_private_documents enable row level security;
alter table public.mobility_private_locations enable row level security;
alter table public.mobility_provider_markets enable row level security;
alter table public.mobility_providers enable row level security;
alter table public.mobility_rental_offers enable row level security;
alter table public.mobility_request_private enable row level security;
alter table public.mobility_requests enable row level security;
alter table public.mobility_transfer_services enable row level security;
alter table public.mobility_vehicle_allocations enable row level security;
alter table public.mobility_vehicles enable row level security;

grant usage on schema public to anon, authenticated, service_role;

-- Remove legacy project defaults first. This makes a replay on a new project
-- and a rollout on an older project converge on the same least-privilege set.
revoke all privileges on all tables in schema public from anon, authenticated;
revoke all privileges on all sequences in schema public from anon, authenticated;

-- Server routes are the trusted boundary for private writes. The service key
-- is never exposed to a browser and still remains subject to application-level
-- authorization, audit and idempotency checks.
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select, update on all sequences in schema public to service_role;

-- Anonymous access is read-only. Public mutations go through protected server
-- routes (CAPTCHA/rate limit/idempotency) rather than directly through PostgREST.
grant select on table
  public.blog_article_comments,
  public.content_freshness,
  public.forum_categories,
  public.forum_posts,
  public.forum_threads,
  public.group_trip_listings,
  public.local_experts,
  public.search_documents,
  public.shop_product_categories,
  public.shop_product_images,
  public.shop_products,
  public.site_settings_control_plane,
  public.sputnik8_cities,
  public.sputnik8_countries,
  public.sputnik8_products,
  public.sputnik8_reviews,
  public.tour_availability_slots,
  public.tourist_reviews,
  public.trip_prep_items,
  public.trip_prep_templates,
  public.tripster_cities,
  public.tripster_countries,
  public.tripster_experiences,
  public.tripster_reviews,
  public.youtravel_offers,
  public.youtravel_tours
to anon;

grant select on table
  public.admin_audit_log,
  public.admin_role_presets,
  public.admin_staff,
  public.ai_match_sessions,
  public.api_keys,
  public.booking_attribution,
  public.booking_commission_snapshots,
  public.bookings,
  public.content_documents,
  public.content_freshness,
  public.content_revisions,
  public.conversation_threads,
  public.forum_categories,
  public.moderation_queue,
  public.partner_webhook_deliveries,
  public.payout_records,
  public.platform_commission_rules,
  public.search_documents,
  public.shop_orders,
  public.shop_product_categories,
  public.shop_product_images,
  public.shop_products,
  public.site_settings,
  public.site_settings_control_plane,
  public.sputnik8_cities,
  public.sputnik8_countries,
  public.sputnik8_products,
  public.sputnik8_reviews,
  public.tour_availability_slots,
  public.trip_prep_items,
  public.trip_prep_templates,
  public.tripster_cities,
  public.tripster_countries,
  public.tripster_experiences,
  public.tripster_reviews,
  public.youtravel_offers,
  public.youtravel_tours
to authenticated;

grant select, update on table
  public.admin_notifications,
  public.notification_events,
  public.profiles
to authenticated;

grant insert, select on table
  public.conversation_messages,
  public.forum_threads,
  public.privacy_requests
to authenticated;

grant insert, select, update on table
  public.blog_comment_reports,
  public.expert_inquiries,
  public.forum_post_reports,
  public.group_trip_listings,
  public.group_trip_members,
  public.local_experts,
  public.message_reads,
  public.notification_preferences,
  public.organizer_applications,
  public.organizer_inbox_reads,
  public.review_reports,
  public.tourist_reviews
to authenticated;

grant select, insert, update, delete on table
  public.blog_article_comments,
  public.blog_reading_history,
  public.cms_media_assets,
  public.forum_posts,
  public.partner_webhooks,
  public.push_subscriptions,
  public.tours,
  public.trip_prep_progress,
  public.typing_presence
to authenticated;

grant select, insert, delete on table public.user_favorites to authenticated;
