import { getAppRuntimeMode } from "@/lib/runtime-mode";

/** Demo localStorage seeds are available only in the isolated demo build. */
export function shouldSeedDemoData(): boolean {
  if (getAppRuntimeMode() !== "demo") return false;
  if (process.env.NEXT_PUBLIC_ENABLE_DEMO_SEED === "false") return false;
  return true;
}
