/** Explicit user theme preference stored in localStorage / cookie */
export type ThemePreference = "light" | "dark";

/** Resolved theme applied to the document */
export type ResolvedTheme = ThemePreference;

/** Dark theme is not production-ready — force light until enabled. */
export const DARK_THEME_ENABLED = false;

export const THEME_STORAGE_KEY = "site-theme";
export const THEME_COOKIE_NAME = "site-theme";
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
