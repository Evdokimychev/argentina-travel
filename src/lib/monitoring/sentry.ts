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

    Sentry.init({
      dsn,
      enabled: true,
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
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
      for (const [key, value] of Object.entries(context.extra ?? {})) {
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
    const email = user.email?.trim().toLowerCase();
    const role = user.role?.trim();
    const roles = user.roles?.filter(Boolean) ?? [];

    Sentry.setUser({
      id: id || undefined,
      email: email || undefined,
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
      data: input.data,
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
