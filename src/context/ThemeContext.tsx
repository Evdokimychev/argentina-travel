"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  applyThemeToDocument,
  clearThemePreference,
  getSystemTheme,
  persistThemePreference,
  readStoredThemePreference,
  resolveTheme,
} from "@/lib/theme-storage";
import { DARK_THEME_ENABLED, type ResolvedTheme, type ThemePreference } from "@/types/theme";

interface ThemeContextValue {
  /** Saved preference; null when following system default */
  preference: ThemePreference | null;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemePreference) => void;
  toggleTheme: () => void;
  ready: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreference] = useState<ThemePreference | null>(null);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!DARK_THEME_ENABLED) {
      clearThemePreference();
      setPreference(null);
      setResolvedTheme("light");
      applyThemeToDocument("light");
      setReady(true);
      return;
    }

    const stored = readStoredThemePreference();
    const resolved = resolveTheme(stored);
    setPreference(stored);
    setResolvedTheme(resolved);
    applyThemeToDocument(resolved);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!DARK_THEME_ENABLED || preference !== null) return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    function syncSystemTheme() {
      const next = getSystemTheme();
      setResolvedTheme(next);
      applyThemeToDocument(next);
    }

    syncSystemTheme();
    media.addEventListener("change", syncSystemTheme);
    return () => media.removeEventListener("change", syncSystemTheme);
  }, [preference]);

  const setTheme = useCallback((theme: ThemePreference) => {
    if (!DARK_THEME_ENABLED) {
      applyThemeToDocument("light");
      return;
    }
    setPreference(theme);
    setResolvedTheme(theme);
    persistThemePreference(theme);
    applyThemeToDocument(theme);
  }, []);

  const toggleTheme = useCallback(() => {
    if (!DARK_THEME_ENABLED) return;
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }, [resolvedTheme, setTheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      preference,
      resolvedTheme,
      setTheme,
      toggleTheme,
      ready,
    }),
    [preference, resolvedTheme, setTheme, toggleTheme, ready]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
