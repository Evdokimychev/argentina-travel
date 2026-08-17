import { scrubMonitoringData } from "@/lib/security/monitoring-scrub";

type SentryModule = typeof import("@sentry/nextjs");
type SentryBreadcrumbLevel = "fatal" | "error" | "warning" | "log" | "info" | "debug";
type SentryUserLike = {
  id?: string | null;
  email?: string | null;
  role?: string | null;
  roles?: string[] | null;
};
type CaptureContext = {
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
};

let sentryModule: SentryModule | null | undefined;
let initPromise: Promise<void> | null = null;

function getDsn(): string | undefined {
  const dsn =
    process.env.NEXT_PUBLIC_SENTRY_DSN?.trim() || process.env.SENTRY_DSN?.trim();
  return dsn || undefined;
}

export function getSentryRelease(): string | undefined {
  const release =
    process.env.NEXT_PUBLIC_SENTRY_RELEASE?.trim() ||
    process.env.SENTRY_RELEASE?.trim() ||
    process.env.VERCEL_GIT_COMMIT_SHA?.trim() ||
    process.env.GIT_SHA?.trim();
  return release || undefined;
}

export function getSentryEnvironment(): string {
  return (
    process.env.SENTRY_ENVIRONMENT?.trim() ||
    process.env.VERCEL_ENV?.trim() ||
    process.env.DEPLOY_ENV?.trim() ||
    process.env.NODE_ENV ||
    "development"
  );
}

export function isSentryEnabled(): boolean {
  return Boolean(getDsn());
}

async function loadSentry(): Promise<SentryModule | null> {
  if (sentryModule !== undefined) {
    return sentryModule;
  }

  if (!isSentryEnabled()) {
    sentryModule = null;
    return null;
  }

  try {
    sentryModule = await import("@sentry/nextjs");
    return sentryModule;
  } catch {
    sentryModule = null;
    return null;
  }
}

export async function initSentry(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const dsn = getDsn();
    if (!dsn) return;

    const Sentry = await loadSentry();
    if (!Sentry) return;
    const release = getSentryRelease();

    Sentry.init({
      dsn,
      enabled: true,
      environment: getSentryEnvironment(),
      ...(release ? { release } : {}),
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1,
      sendDefaultPii: false,
    });
  })();

  return initPromise;
}

export function captureException(error: unknown, context?: CaptureContext): void {
  if (!isSentryEnabled()) return;

  void loadSentry().then((Sentry) => {
    if (!Sentry) return;
    if (!context) {
      Sentry.captureException(error);
      return;
    }

    Sentry.withScope((scope) => {
      for (const [key, value] of Object.entries(context.tags ?? {})) {
        scope.setTag(key, value);
      }
      const scrubbedExtra = scrubMonitoringData(context.extra);
      for (const [key, value] of Object.entries(scrubbedExtra ?? {})) {
        scope.setExtra(key, value);
      }
      Sentry.captureException(error);
    });
  });
}

export function setSentryUserContext(user: SentryUserLike | null): void {
  if (!isSentryEnabled()) return;

  void loadSentry().then((Sentry) => {
    if (!Sentry) return;
    if (!user) {
      Sentry.setUser(null);
      return;
    }

    const id = user.id?.trim();
    const role = user.role?.trim();
    const roles = user.roles?.filter(Boolean) ?? [];

    // Intentionally omit email and other PII even if callers pass them.
    Sentry.setUser({
      id: id || undefined,
    });

    if (role) {
      Sentry.setTag("user.role", role);
    }
    if (roles.length > 0) {
      Sentry.setTag("user.roles", roles.join(","));
    }
  });
}

export function addBreadcrumb(input: {
  category: string;
  message: string;
  level?: SentryBreadcrumbLevel;
  data?: Record<string, unknown>;
}): void {
  if (!isSentryEnabled()) return;

  void loadSentry().then((Sentry) => {
    Sentry?.addBreadcrumb({
      category: input.category,
      message: input.message,
      level: input.level ?? "info",
      data: scrubMonitoringData(input.data),
    });
  });
}

export function addBookingBreadcrumb(action: string, data?: Record<string, unknown>): void {
  addBreadcrumb({ category: "booking", message: action, data });
}

export function addPaymentBreadcrumb(action: string, data?: Record<string, unknown>): void {
  addBreadcrumb({ category: "payment", message: action, data });
}

export function addCronBreadcrumb(action: string, data?: Record<string, unknown>): void {
  addBreadcrumb({
    category: "cron",
    message: action,
    level: data?.ok === false ? "error" : "info",
    data,
  });
}

export async function captureRequestError(
  ...args: Parameters<SentryModule["captureRequestError"]>
): Promise<void> {
  if (!isSentryEnabled()) return;

  const Sentry = await loadSentry();
  Sentry?.captureRequestError(...args);
}

export async function captureRouterTransitionStart(
  ...args: Parameters<SentryModule["captureRouterTransitionStart"]>
): Promise<void> {
  if (!isSentryEnabled()) return;

  const Sentry = await loadSentry();
  Sentry?.captureRouterTransitionStart(...args);
}

export async function captureOperationalTestException(): Promise<{
  enabled: boolean;
  eventId: string | null;
  release: string | null;
  environment: string;
}> {
  const release = getSentryRelease() ?? null;
  const environment = getSentryEnvironment();
  const Sentry = await loadSentry();
  if (!Sentry) {
    return { enabled: false, eventId: null, release, environment };
  }

  let eventId: string | null = null;
  Sentry.withScope((scope) => {
    scope.setTag("area", "ops");
    scope.setTag("verification", "sentry_test_exception");
    if (release) scope.setTag("release_sha", release);
    eventId = Sentry.captureException(
      new Error("Operational Sentry verification event (intentional)"),
    );
  });
  await Sentry.flush(2_000);

  return { enabled: true, eventId, release, environment };
}
