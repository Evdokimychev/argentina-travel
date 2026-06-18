const AUTH_NEXT_KEY = "argentina-travel-auth-next";

export function readAuthNextPath(): string | null {
  if (typeof window === "undefined") return null;
  const value = window.sessionStorage.getItem(AUTH_NEXT_KEY);
  if (!value || !value.startsWith("/")) return null;
  return value;
}

export function storeAuthNextPath(path: string) {
  if (typeof window === "undefined") return;
  if (!path.startsWith("/")) return;
  window.sessionStorage.setItem(AUTH_NEXT_KEY, path);
}

export function clearAuthNextPath() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(AUTH_NEXT_KEY);
}
