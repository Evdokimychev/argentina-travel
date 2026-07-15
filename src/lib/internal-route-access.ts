import type { AppRuntimeMode } from "./runtime-mode";

export function isPathWithin(pathname: string | null | undefined, root: string): boolean {
  return pathname === root || pathname?.startsWith(`${root}/`) === true;
}

export function isWorkspacePath(pathname: string | null | undefined): boolean {
  return ["/profile", "/organizer", "/admin"].some((root) => isPathWithin(pathname, root));
}

export function shouldBlockInternalRoute(
  pathname: string,
  runtimeMode: AppRuntimeMode,
): boolean {
  return runtimeMode === "production" && (pathname === "/dev" || pathname.startsWith("/dev/"));
}
