import "server-only";

import { getIntuiConfig, isIntuiConfigured } from "@/lib/intui/env";
import type { IntuiApiStatus } from "@/lib/intui/types";

export class IntuiError extends Error {
  readonly status: IntuiApiStatus | "http_error" | "not_configured";

  constructor(message: string, status: IntuiError["status"] = "http_error") {
    super(message);
    this.name = "IntuiError";
    this.status = status;
  }
}

type IntuiResponseBody = {
  status?: IntuiApiStatus;
  message?: string;
  error?: string;
  [key: string]: unknown;
};

export async function postIntuiMethod<T>(
  method: string,
  params: Record<string, unknown>
): Promise<T> {
  if (!isIntuiConfigured()) {
    throw new IntuiError("INTUI_API_KEY is not configured", "not_configured");
  }

  const config = getIntuiConfig();
  const url = `${config.baseUrl}/${method}/`;
  const body = {
    apikey: config.apiKey,
    ...params,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as IntuiResponseBody | null;

  if (!response.ok) {
    throw new IntuiError(
      payload?.message || payload?.error || `Intui API request failed (${response.status})`,
      "http_error"
    );
  }

  if (payload?.status === "authorization_error") {
    throw new IntuiError("Intui API authorization failed", "authorization_error");
  }

  if (payload?.status === "wrong_params") {
    throw new IntuiError(payload.message || "Invalid Intui API parameters", "wrong_params");
  }

  if (payload?.status === "err_url") {
    throw new IntuiError(payload.message || "Invalid Intui API URL", "err_url");
  }

  return payload as T;
}
