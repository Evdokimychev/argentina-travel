type SentryModule = typeof import("@sentry/nextjs");

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

export function captureException(error: unknown): void {
  if (!isSentryEnabled()) return;

  void loadSentry().then((Sentry) => {
    Sentry?.captureException(error);
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
