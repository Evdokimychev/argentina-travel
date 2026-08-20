# Master System Inventory — Iteration 5
Generated: 2026-08-19. Source: `docs/audit/route-inventory.csv`, `src/types/database.ts`, `vercel.json`, `FLAG_DESTINY.json`.
Runtime production SHA `81055b13` is older than this candidate. Live counts below are **source** counts unless marked live.
## Surface
| Kind | Count |
|------|------:|
| App Router pages | 159 |
| Route handlers | 314 |
| Middleware | 1 |
| Cron route files | 22 |
| Vercel scheduled crons | 4 |
| Typed public tables | 97 |
| FLAG_DESTINY entries | 9 |
| process.env names referenced in src | 175 |
## Page visibility (heuristic from path)
| Visibility | Pages |
|------------|------:|
| admin | 51 |
| authenticated | 11 |
| organizer | 21 |
| public | 76 |

## Handler methods
| Method | Handlers |
|--------|---------:|
| GET | 213 |
| POST | 140 |
| PATCH | 39 |
| DELETE | 19 |
| PUT | 8 |
| OPTIONS | 5 |
| HEAD | 1 |

## API families (first segment)
| Family | Handlers |
|--------|---------:|
| `/api/admin` | 114 |
| `/api/organizer` | 35 |
| `/api/cron` | 22 |
| `/api/bookings` | 14 |
| `/api/auth` | 11 |
| `/api/excursions` | 7 |
| `/api/affiliate` | 6 |
| `/api/conversations` | 5 |
| `/api/forum` | 5 |
| `/api/tours` | 5 |
| `/api/v1` | 5 |
| `/api/webhooks` | 5 |
| `/api/blog` | 4 |
| `/api/experts` | 4 |
| `/api/health` | 4 |
| `/api/notifications` | 4 |
| `/api/reviews` | 4 |
| `/api/audio-guides` | 3 |
| `/api/group-trips` | 3 |
| `/api/mobility` | 3 |
| `/api/site` | 3 |
| `/api/youtravel` | 3 |
| `/api/exchange-rates` | 2 |
| `/api/map` | 2 |
| `/api/partner-tours` | 2 |
| `/api/places` | 2 |
| `/api/privacy` | 2 |
| `/api/shop` | 2 |
| `/api/transfers` | 2 |
| `/api/trip-prep` | 2 |
| `/api/acceptance` | 1 |
| `/api/ai` | 1 |
| `/api/analytics` | 1 |
| `/api/apartments` | 1 |
| `/api/assistant` | 1 |
| `/api/cms` | 1 |
| `/api/contact` | 1 |
| `/api/esim` | 1 |
| `/api/favorites` | 1 |
| `/api/feature-flags` | 1 |

## Cron map
| Route | Scheduled in vercel.json | Orchestrator |
|-------|--------------------------|--------------|
| `/api/cron/affiliate-sync` | yes | manual / undocumented |
| `/api/cron/bookings/expire-unpaid` | no | platform-maintenance |
| `/api/cron/cms/publish-scheduled` | no | platform-maintenance |
| `/api/cron/content-factory-publish` | yes | manual / undocumented |
| `/api/cron/content-freshness` | no | platform-maintenance |
| `/api/cron/ingestion` | no | manual / undocumented |
| `/api/cron/messaging/booking-reminder-24h` | no | platform-maintenance |
| `/api/cron/messaging/cleanup-typing` | no | platform-maintenance |
| `/api/cron/notifications/digest` | no | platform-maintenance |
| `/api/cron/notifications/email-retry` | no | platform-maintenance |
| `/api/cron/ops/backup-hint` | no | platform-maintenance (Sunday) |
| `/api/cron/ops/health-report` | no | manual / undocumented |
| `/api/cron/platform-maintenance` | yes | manual / undocumented |
| `/api/cron/privacy/process` | no | platform-maintenance |
| `/api/cron/search/reindex` | no | platform-maintenance |
| `/api/cron/seo-search-sync` | yes | manual / undocumented |
| `/api/cron/sputnik8-sync` | no | affiliate-sync |
| `/api/cron/trip-prep/reminders` | no | platform-maintenance |
| `/api/cron/tripster-sync` | no | affiliate-sync |
| `/api/cron/youtravel-affise-snapshot` | no | affiliate-sync |
| `/api/cron/youtravel-booking-status` | no | affiliate-sync |
| `/api/cron/youtravel-sync` | no | affiliate-sync |

## Feature flags (FLAG_DESTINY)
| id | class | default | owner |
|----|-------|---------|-------|
| `cmsBlogCutover` | MIGRATION | False | content-os |
| `cmsGuideCutover` | MIGRATION | False | content-os |
| `cmsDestinationCutover` | MIGRATION | False | content-os |
| `cmsPlaceCutover` | MIGRATION | False | geography |
| `PUBLIC_LAUNCH_SHOW_UNFINISHED` | ROLLBACK_SWITCH | unset | release |
| `own_payment.productionEnabled` | PERMANENT_CONFIGURATION | False | commerce |
| `DARK_THEME_ENABLED` | EXPERIMENT | False | ux |
| `homepage_recommendations_v2` | EXPERIMENT | db feature_flags | discovery |
| `api.podbor.narrative` | DEAD_FLAG | frozen_410 | discovery |

Production DB `feature_flags` values: **NOT_PROVEN** (REST 402).

## Environment names (src references, values not listed)
`ADMIN_AUTOMATION_SECRET`, `AIRALO_AFFILIATE_HOME_URL`, `AIRALO_FEED_CACHE_MINUTES`, `AIRALO_FEED_PATH`, `AIRALO_FEED_URL`, `AI_GATEWAY_API_KEY`, `ALLOW_SERVICE_ROLE_ADMIN_BEARER`, `ANALYTICS_TRAFFIC_TYPE`, `ANALYZE`, `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `APP_VERSION`, `BLOG_ANALYTICS_IMPORT_ENABLED`, `BOOKING_LOOKUP_SECRET`, `BUNDLE_REPORT_FILE`, `CI`, `CMS_MEDIA_SKIP_MANIFEST_SYNC`, `CONTENT_FRESHNESS_NOTIFY_EMAILS`, `CONTENT_OVERHAUL_BASE_URL`, `CRON_SECRET`, `DATABASE_URL`, `DEPLOY_ENV`, `ENABLE_LIVE_PARTNER_DETAIL_ENRICHMENT`, `GEONAMES_USERNAME`, `GITHUB_BASE_REF`, `GIT_SHA`, `GUIDE_ASSISTANT_PROVIDER`, `INTUI_API_BASE_URL`, `INTUI_API_KEY`, `INTUI_DEFAULT_CURRENCY`, `INTUI_DEFAULT_LANG`, `INTUI_PARTNER_ID`, `LEADS_NOTIFY_EMAIL`, `LEADS_NOTIFY_FROM`, `LIGHTHOUSE_RUNS_PER_PATH`, `MEDIA_FTP_PORT`, `MEDIA_FTP_REMOTE_ROOT`, `MEDIA_FTP_SECURE`, `MEDIA_FTP_VERBOSE`, `MEDIA_RIGHTS_BASE_REF`, `MEDIA_STORAGE_BACKEND`, `MEILISEARCH_API_KEY`, `MEILISEARCH_HOST`, `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_PUBLIC_KEY`, `MERCADOPAGO_REFUNDS_ENABLED`, `MERCADOPAGO_WEBHOOK_SECRET`, `NEXT_DIST_DIR`, `NEXT_PUBLIC_AHREFS_SITE_VERIFICATION`, `NEXT_PUBLIC_APP_MODE`, `NEXT_PUBLIC_BING_SITE_VERIFICATION`, `NEXT_PUBLIC_CLARITY_PROJECT_ID`, `NEXT_PUBLIC_DISABLE_NEXT_IMAGE_OPTIMIZATION`, `NEXT_PUBLIC_ENABLE_DEMO_SEED`, `NEXT_PUBLIC_GA4_MEASUREMENT_ID`, `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`, `NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_LOCALRENT_AFFILIATE_ID`, `NEXT_PUBLIC_LOCALRENT_CITY_ID`, `NEXT_PUBLIC_LOCALRENT_COUNTRY_ID`, `NEXT_PUBLIC_LOCALRENT_ROUTING`, `NEXT_PUBLIC_LOCALRENT_Z_INDEX`, `NEXT_PUBLIC_MEDIA_CDN_URL`, `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY`, `NEXT_PUBLIC_PARTNER_IMAGE_PROXY`, `NEXT_PUBLIC_RELEASE_GIT_SHA`, `NEXT_PUBLIC_SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_RELEASE`, `NEXT_PUBLIC_SITE_DOMAIN`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_STRIPE_ENABLED`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_AUTH`, `NEXT_PUBLIC_SUPABASE_TOURS`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_TOURS_SOURCE`, `NEXT_PUBLIC_TRAVELPAYOUTS_WL_ID`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `NEXT_PUBLIC_VERCEL_ENV`, …
