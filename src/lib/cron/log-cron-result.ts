import { appendCronRouteRun } from "@/lib/ops/ops-status";
import { addCronBreadcrumb, captureException } from "@/lib/monitoring/sentry";

type CronLogResult = {
  ok: boolean;
  message?: string;
  ranAt?: string;
  statusCode?: number;
  durationMs?: number;
  details?: Record<string, unknown>;
  error?: unknown;
};

function resolveErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Неизвестная ошибка";
}

async function sendSlackCronFailure(route: string, payload: CronLogResult & { message: string; ranAt: string }) {
  const webhook = process.env.SLACK_OPS_WEBHOOK?.trim();
  if (!webhook) return;

  const text = [
    ":rotating_light: Сбой cron-задачи",
    `Маршрут: ${route}`,
    `Время: ${payload.ranAt}`,
    `Сообщение: ${payload.message}`,
  ].join("\n");

  try {
    await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        attachments: payload.details
          ? [
              {
                color: "#dc2626",
                text: `details: ${JSON.stringify(payload.details).slice(0, 3000)}`,
              },
            ]
          : undefined,
      }),
    });
  } catch {
    // Alerts must not break cron handlers.
  }
}

export async function logCronResult(route: string, result: CronLogResult): Promise<void> {
  const normalizedRoute = route.trim();
  if (!normalizedRoute) return;

  const ranAt = result.ranAt ?? new Date().toISOString();
  const message = result.message?.trim() || (result.ok ? "OK" : resolveErrorMessage(result.error));
  const details = result.details;

  appendCronRouteRun({
    route: normalizedRoute,
    ranAt,
    ok: result.ok,
    message,
    statusCode: result.statusCode,
    durationMs: result.durationMs,
    details,
  });

  addCronBreadcrumb("cron.result", {
    route: normalizedRoute,
    ok: result.ok,
    message,
    statusCode: result.statusCode,
    durationMs: result.durationMs,
    ...(details ?? {}),
  });

  if (result.ok) return;

  const error =
    result.error instanceof Error
      ? result.error
      : new Error(`[cron] ${normalizedRoute}: ${message}`);
  captureException(error, {
    tags: {
      area: "cron",
      route: normalizedRoute,
    },
    extra: {
      ranAt,
      statusCode: result.statusCode,
      durationMs: result.durationMs,
      details,
    },
  });

  await sendSlackCronFailure(normalizedRoute, { ...result, message, ranAt });
}
