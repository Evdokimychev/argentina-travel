import { captureRequestError, initSentry } from "@/lib/monitoring/sentry";

export async function register() {
  await initSentry();
}

export const onRequestError = captureRequestError;
