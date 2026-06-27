/** Demo localStorage seeds — off in production builds by default. */
export function shouldSeedDemoData(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  if (process.env.NEXT_PUBLIC_ENABLE_DEMO_SEED === "false") return false;
  if (process.env.DEPLOY_ENV === "production" || process.env.DEPLOY_ENV === "staging") {
    return false;
  }
  return true;
}
