"use client";

import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/cn";
import { useTheme } from "@/context/ThemeContext";

type ThemeToggleVariant = "header" | "settings";

interface ThemeToggleProps {
  variant?: ThemeToggleVariant;
  className?: string;
}

export default function ThemeToggle({ variant = "header", className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme, toggleTheme, ready } = useTheme();
  const isDark = resolvedTheme === "dark";

  if (variant === "header") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        disabled={!ready}
        aria-label={isDark ? "Светлая тема" : "Тёмная тема"}
        title={isDark ? "Светлая тема" : "Тёмная тема"}
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-charcoal/[0.06] text-foreground ring-1 ring-charcoal/10 backdrop-blur-sm transition-colors hover:bg-sky/10 hover:text-sky hover:ring-sky/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40 disabled:opacity-60 dark:bg-white/10 dark:ring-white/10 dark:hover:bg-sky/20",
          className
        )}
      >
        {isDark ? (
          <Sun className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
        ) : (
          <Moon className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
        )}
      </button>
    );
  }

  return (
    <div className={cn("grid grid-cols-2 gap-2", className)} role="group" aria-label="Тема оформления">
      <button
        type="button"
        onClick={() => setTheme("light")}
        disabled={!ready}
        aria-pressed={!isDark}
        className={cn(
          "flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors",
          !isDark
            ? "border-sky/30 bg-sky/10 text-sky ring-1 ring-sky/15"
            : "border-border-subtle bg-surface-elevated text-muted hover:bg-surface-muted hover:text-foreground"
        )}
      >
        <Sun className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
        Светлая тема
      </button>
      <button
        type="button"
        onClick={() => setTheme("dark")}
        disabled={!ready}
        aria-pressed={isDark}
        className={cn(
          "flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors",
          isDark
            ? "border-sky/30 bg-sky/10 text-sky ring-1 ring-sky/15"
            : "border-border-subtle bg-surface-elevated text-muted hover:bg-surface-muted hover:text-foreground"
        )}
      >
        <Moon className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
        Тёмная тема
      </button>
    </div>
  );
}
