import {
  THEME_COOKIE_MAX_AGE,
  THEME_COOKIE_NAME,
  THEME_STORAGE_KEY,
  type ResolvedTheme,
  type ThemePreference,
} from "@/types/theme";

export function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function readStoredThemePreference(): ThemePreference | null {
  if (typeof window === "undefined") return null;

  try {
    const fromStorage = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (fromStorage === "light" || fromStorage === "dark") {
      return fromStorage;
    }
  } catch {
    /* ignore */
  }

  try {
    const match = document.cookie.match(
      new RegExp(`(?:^|; )${THEME_COOKIE_NAME.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]*)`)
    );
    const fromCookie = match?.[1] ? decodeURIComponent(match[1]) : null;
    if (fromCookie === "light" || fromCookie === "dark") {
      return fromCookie;
    }
  } catch {
    /* ignore */
  }

  return null;
}

export function resolveTheme(preference: ThemePreference | null): ResolvedTheme {
  return preference ?? getSystemTheme();
}

export function applyThemeToDocument(theme: ResolvedTheme): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function persistThemePreference(preference: ThemePreference): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    /* ignore */
  }

  try {
    document.cookie = `${THEME_COOKIE_NAME}=${encodeURIComponent(preference)}; path=/; max-age=${THEME_COOKIE_MAX_AGE}; SameSite=Lax`;
  } catch {
    /* ignore */
  }
}

export function clearThemePreference(): void {
  try {
    window.localStorage.removeItem(THEME_STORAGE_KEY);
  } catch {
    /* ignore */
  }

  try {
    document.cookie = `${THEME_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
  } catch {
    /* ignore */
  }
}

/** Inline bootstrap script — prevents flash of wrong theme before hydration */
export const THEME_BOOTSTRAP_SCRIPT = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var c=${JSON.stringify(THEME_COOKIE_NAME)};var s=localStorage.getItem(k);var m=document.cookie.match(new RegExp('(?:^|; )'+c+'=([^;]*)'));var p=s||(m?decodeURIComponent(m[1]):null);var d=p==='dark'||(p!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);document.documentElement.dataset.theme=d?'dark':'light';document.documentElement.style.colorScheme=d?'dark':'light';}catch(e){}})();`;
