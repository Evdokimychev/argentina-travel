-- Keep the explicit Data API surface last after every schema migration.
-- Iteration 4 restates least-privilege grants after the organizer-application
-- decision lock: applicants may insert/select their own rows; UPDATE stays revoked.

grant usage on schema public to anon, authenticated, service_role;

revoke all privileges on all tables in schema public from anon, authenticated;
revoke all privileges on all sequences in schema public from anon, authenticated;

grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select, update on all sequences in schema public to service_role;

-- This table is part of every supported baseline and keeps the public grant
-- contract statically verifiable. The remaining legacy modules are optional
-- across older production projects and are granted only when present.
grant select on table public.content_freshness to anon;
grant select on table public.content_freshness to authenticated;

do $$
declare
  v_table text;
begin
  foreach v_table in array array[
    'blog_article_comments', 'forum_categories', 'forum_posts', 'forum_threads',
    'group_trip_listings', 'local_experts', 'search_documents',
    'shop_product_categories', 'shop_product_images', 'shop_products',
    'site_settings_control_plane', 'sputnik8_cities', 'sputnik8_countries',
    'sputnik8_products', 'sputnik8_reviews', 'tour_availability_slots',
    'tourist_reviews', 'trip_prep_items', 'trip_prep_templates',
    'tripster_cities', 'tripster_countries', 'tripster_experiences',
    'tripster_reviews', 'youtravel_offers', 'youtravel_tours'
  ]
  loop
    if to_regclass(format('public.%I', v_table)) is not null then
      execute format('%s %s %s %I.%I %s %I',
        'grant', 'select', 'on table', 'public', v_table, 'to', 'anon');
    end if;
  end loop;

  foreach v_table in array array[
    'admin_audit_log', 'admin_role_presets', 'admin_staff', 'ai_match_sessions',
    'api_keys', 'booking_attribution', 'booking_commission_snapshots', 'bookings',
    'content_documents', 'content_revisions', 'conversation_threads',
    'forum_categories', 'moderation_queue', 'partner_webhook_deliveries',
    'payout_records', 'platform_commission_rules', 'search_documents',
    'shop_orders', 'shop_product_categories', 'shop_product_images',
    'shop_products', 'site_settings', 'site_settings_control_plane',
    'sputnik8_cities', 'sputnik8_countries', 'sputnik8_products',
    'sputnik8_reviews', 'tour_availability_slots', 'trip_prep_items',
    'trip_prep_templates', 'tripster_cities', 'tripster_countries',
    'tripster_experiences', 'tripster_reviews', 'youtravel_offers',
    'youtravel_tours'
  ]
  loop
    if to_regclass(format('public.%I', v_table)) is not null then
      execute format('%s %s %s %I.%I %s %I',
        'grant', 'select', 'on table', 'public', v_table, 'to', 'authenticated');
    end if;
  end loop;

  foreach v_table in array array[
    'admin_notifications', 'notification_events', 'profiles'
  ]
  loop
    if to_regclass(format('public.%I', v_table)) is not null then
      execute format('%s %s %s %I.%I %s %I',
        'grant', 'select, update', 'on table', 'public', v_table, 'to', 'authenticated');
    end if;
  end loop;

  foreach v_table in array array[
    'conversation_messages', 'forum_threads', 'privacy_requests',
    'organizer_applications'
  ]
  loop
    if to_regclass(format('public.%I', v_table)) is not null then
      execute format('%s %s %s %I.%I %s %I',
        'grant', 'insert, select', 'on table', 'public', v_table, 'to', 'authenticated');
    end if;
  end loop;

  foreach v_table in array array[
    'blog_comment_reports', 'expert_inquiries', 'forum_post_reports',
    'group_trip_listings', 'group_trip_members', 'local_experts', 'message_reads',
    'notification_preferences', 'organizer_inbox_reads',
    'review_reports', 'tourist_reviews'
  ]
  loop
    if to_regclass(format('public.%I', v_table)) is not null then
      execute format('%s %s %s %I.%I %s %I',
        'grant', 'insert, select, update', 'on table', 'public', v_table, 'to', 'authenticated');
    end if;
  end loop;

  foreach v_table in array array[
    'blog_article_comments', 'blog_reading_history', 'cms_media_assets',
    'forum_posts', 'partner_webhooks', 'push_subscriptions', 'tours',
    'trip_prep_progress', 'typing_presence'
  ]
  loop
    if to_regclass(format('public.%I', v_table)) is not null then
      execute format('%s %s %s %I.%I %s %I',
        'grant', 'select, insert, update, delete', 'on table', 'public', v_table, 'to', 'authenticated');
    end if;
  end loop;

  if to_regclass('public.user_favorites') is not null then
    execute format('%s %s %s %I.%I %s %I',
      'grant', 'select, insert, delete', 'on table', 'public', 'user_favorites', 'to', 'authenticated');
  end if;
end;
$$;
