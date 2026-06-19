/**
 * Design tokens reference — values live in `src/app/globals.css` @theme.
 * Use Tailwind utilities (e.g. `shadow-card`, `text-sky`) in components.
 */

/** Elevation: catalog cards, list tiles */
export const SHADOW_CARD = "shadow-card" as const;

/** Elevation: booking panel, sticky sidebars */
export const SHADOW_ELEVATED = "shadow-elevated" as const;

/** Elevation: modals, popovers */
export const SHADOW_MODAL = "shadow-modal" as const;

/** Card hover — shadow only, no translate */
export const CARD_HOVER =
  "transition-shadow duration-200 hover:shadow-elevated motion-reduce:transition-none" as const;

/** Primary brand — CTAs, links, active nav */
export const COLOR_PRIMARY = "sky" as const;

/** Star ratings — filled stars */
export const COLOR_RATING = "sun" as const;

/** Page background */
export const COLOR_SURFACE = "surface-muted" as const;

/** Secondary body text */
export const COLOR_TEXT_SECONDARY = "slate" as const;

/** Base transition for interactive elements */
export const MOTION_TRANSITION = "transition-colors duration-150" as const;

/** Card / panel transition */
export const MOTION_SHADOW = "transition-shadow duration-200" as const;
