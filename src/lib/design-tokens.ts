/**
 * E49 — Tailwind class strings backed by CSS design tokens (src/styles/tokens.css).
 * Adopt in new UI; legacy utility names (bg-sky, text-charcoal, rounded-2xl) remain valid.
 */

/** Card / panel surface — border, elevation, radius from tokens */
export const tokenCardSurfaceClass =
  "rounded-card border border-border-subtle bg-surface-elevated shadow-card";

/** Hover elevation for interactive cards */
export const tokenCardInteractiveClass =
  "card-hover transition-shadow duration-base motion-reduce:transition-none";

/** Shared focus ring for actionable controls */
export const tokenFocusRingClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40";

/** Primary button surface */
export const tokenButtonPrimaryClass =
  "bg-sky text-white hover:bg-sky-dark shadow-sm";

/** Outline / secondary button surface */
export const tokenButtonOutlineClass =
  "border border-border-subtle bg-surface-elevated hover:bg-surface-muted text-foreground";

/** Site header shell — fixed chrome with token z-index and borders */
export const tokenHeaderShellClass =
  "site-header fixed inset-x-0 top-0 z-header border-b border-charcoal/[0.06] bg-surface-elevated/80 backdrop-blur-xl supports-[backdrop-filter]:bg-surface-elevated/70 dark:border-white/10 dark:bg-surface-elevated/90 dark:supports-[backdrop-filter]:bg-surface-elevated/80";

/** Header inner navigation bar */
export const tokenHeaderNavBarClass =
  "flex w-full items-center gap-2 rounded-panel border border-charcoal/[0.07] bg-gradient-to-r from-surface-elevated via-surface-muted/30 to-surface-elevated px-2 py-2.5 shadow-header-bar dark:border-white/10 dark:from-surface-elevated dark:via-surface-muted/40 dark:to-surface-elevated dark:shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_8px_24px_-12px_rgba(0,0,0,0.45)] sm:gap-3 sm:px-3";

/** Circular icon control in header */
export const tokenHeaderCircleButtonClass =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-pill bg-charcoal/[0.06] text-foreground ring-1 ring-charcoal/10 backdrop-blur-sm transition-colors hover:bg-sky/10 hover:text-sky hover:ring-sky/25 dark:bg-white/10 dark:ring-white/10 dark:hover:bg-sky/20";
