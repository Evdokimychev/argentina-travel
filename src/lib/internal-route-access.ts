import type { AppRuntimeMode } from "./runtime-mode";

export function shouldBlockInternalRoute(
  pathname: string,
  runtimeMode: AppRuntimeMode,
): boolean {
  return runtimeMode === "production" && (pathname === "/dev" || pathname.startsWith("/dev/"));
}
