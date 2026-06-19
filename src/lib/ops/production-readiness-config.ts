/** Env vars required before production cutover (names only — never log values). */
export const PRODUCTION_REQUIRED_ENV_VARS = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DATABASE_URL",
  "DEPLOY_ENV",
  "CRON_SECRET",
] as const;

/** Recommended for production monitoring and notifications. */
export const PRODUCTION_RECOMMENDED_ENV_VARS = [
  "GIT_SHA",
  "SENTRY_DSN",
  "NEXT_PUBLIC_SENTRY_DSN",
  "RESEND_API_KEY",
  "LEADS_NOTIFY_EMAIL",
  "NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY",
  "WEB_PUSH_VAPID_PRIVATE_KEY",
  "WEB_PUSH_VAPID_SUBJECT",
] as const;

/** Must be explicitly false in production/staging. */
export const PRODUCTION_FORBIDDEN_TRUE_FLAGS = ["NEXT_PUBLIC_ENABLE_DEMO_SEED"] as const;
