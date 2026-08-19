# Database Domain Matrix — Iteration 5

Typed tables in `src/types/database.ts`: **97**. Live journal/RLS: **NOT_PROVEN** (REST 402, direct PG unreachable).

## Domain counts

| Domain | Tables |
|--------|-------:|
| unclassified | 31 |
| marketplace | 21 |
| cms | 6 |
| booking | 5 |
| dormant | 5 |
| admin | 4 |
| organizer | 4 |
| content | 3 |
| messaging | 3 |
| crm | 2 |
| notifications | 2 |
| payments | 2 |
| settings | 2 |
| affiliate | 1 |
| analytics | 1 |
| flags | 1 |
| geography | 1 |
| identity | 1 |
| privacy | 1 |
| search | 1 |

## Tables

| Table | Domain |
|-------|--------|
| `admin_audit_log` | admin |
| `admin_notifications` | admin |
| `admin_role_presets` | admin |
| `admin_staff` | admin |
| `affiliate_link_clicks` | affiliate |
| `ai_match_events` | unclassified |
| `ai_match_sessions` | unclassified |
| `analytics_events` | analytics |
| `api_key_usage_log` | unclassified |
| `api_keys` | unclassified |
| `blog_article_comments` | content |
| `blog_comment_reports` | content |
| `blog_reading_history` | content |
| `booking_attribution` | booking |
| `booking_commission_snapshots` | booking |
| `booking_lookup_audit_log` | booking |
| `booking_lookup_challenges` | booking |
| `bookings` | booking |
| `cms_import_operations` | cms |
| `cms_media_assets` | cms |
| `cms_search_outbox` | cms |
| `commercial_adapters` | unclassified |
| `commercial_entitlement_definitions` | unclassified |
| `commercial_plan_entitlements` | unclassified |
| `commercial_plans` | unclassified |
| `contact_submissions` | crm |
| `content_documents` | cms |
| `content_freshness` | cms |
| `content_revisions` | cms |
| `conversation_messages` | messaging |
| `conversation_threads` | messaging |
| `expert_inquiries` | unclassified |
| `feature_flags` | flags |
| `forum_categories` | dormant |
| `forum_post_reports` | dormant |
| `forum_posts` | dormant |
| `forum_threads` | dormant |
| `group_trip_listings` | unclassified |
| `group_trip_members` | unclassified |
| `local_experts` | unclassified |
| `map_object_curation` | geography |
| `message_reads` | messaging |
| `moderation_delivery_outbox` | unclassified |
| `moderation_queue` | unclassified |
| `newsletter_subscribers` | crm |
| `notification_events` | notifications |
| `notification_preferences` | notifications |
| `operations_transition_outbox` | unclassified |
| `organizer_applications` | organizer |
| `organizer_commercial_subscriptions` | organizer |
| `organizer_entitlement_overrides` | organizer |
| `organizer_inbox_reads` | organizer |
| `partner_webhook_deliveries` | unclassified |
| `partner_webhooks` | unclassified |
| `payment_audit_log` | payments |
| `payment_transactions` | payments |
| `payout_records` | unclassified |
| `platform_commission_rules` | unclassified |
| `privacy_requests` | privacy |
| `profiles` | identity |
| `push_subscriptions` | unclassified |
| `review_reports` | marketplace |
| `search_documents` | search |
| `seo_provider_connections` | unclassified |
| `seo_search_performance_daily` | unclassified |
| `seo_search_sync_runs` | unclassified |
| `shop_orders` | dormant |
| `site_settings` | settings |
| `site_settings_control_plane` | settings |
| `sputnik8_booking_requests` | marketplace |
| `sputnik8_cities` | marketplace |
| `sputnik8_countries` | marketplace |
| `sputnik8_products` | marketplace |
| `sputnik8_reviews` | marketplace |
| `sputnik8_sync_runs` | marketplace |
| `tour_availability_slots` | marketplace |
| `tour_waitlist_entries` | marketplace |
| `tourist_reviews` | marketplace |
| `tours` | marketplace |
| `trip_prep_items` | unclassified |
| `trip_prep_progress` | unclassified |
| `trip_prep_reminders_sent` | unclassified |
| `trip_prep_templates` | unclassified |
| `tripster_cities` | marketplace |
| `tripster_countries` | marketplace |
| `tripster_experiences` | marketplace |
| `tripster_reviews` | marketplace |
| `tripster_sync_runs` | marketplace |
| `typing_presence` | unclassified |
| `url_redirects` | unclassified |
| `user_favorites` | unclassified |
| `user_interactions` | unclassified |
| `youtravel_affise_snapshots` | marketplace |
| `youtravel_booking_requests` | marketplace |
| `youtravel_offers` | marketplace |
| `youtravel_sync_runs` | marketplace |
| `youtravel_tours` | marketplace |

Prisma models (`prisma/schema.prisma`) are a niche places overlay (7 models), not the operational SSOT.
