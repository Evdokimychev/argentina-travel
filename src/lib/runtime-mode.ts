export type AppRuntimeMode = "production" | "demo";

/** One build-time switch for production services versus isolated local demo data. */
export function getAppRuntimeMode(): AppRuntimeMode {
  const configured = process.env.NEXT_PUBLIC_APP_MODE?.trim().toLowerCase();
  if (configured === "demo") return "demo";
  if (configured === "production") return "production";

  if (
    process.env.NODE_ENV === "production" ||
    process.env.DEPLOY_ENV === "production" ||
    process.env.DEPLOY_ENV === "staging" ||
    process.env.VERCEL_ENV === "production"
  ) {
    return "production";
  }

  return "demo";
}

export function isProductionRuntime(): boolean {
  return getAppRuntimeMode() === "production";
}
