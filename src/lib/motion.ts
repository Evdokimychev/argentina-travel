/**
 * E61 — Motion system tokens and helpers.
 * Subtle, Stripe-like transitions. Respects prefers-reduced-motion.
 */

/** Durations in milliseconds */
export const MOTION_DURATION = {
  fast: 150,
  base: 200,
  slow: 280,
} as const;

/** CSS duration tokens (for className / inline styles) */
export const MOTION_DURATION_CSS = {
  fast: "150ms",
  base: "200ms",
  slow: "280ms",
} as const;

/** Cubic-bezier easing curves */
export const MOTION_EASE = {
  /** Primary exit / enter — smooth deceleration */
  out: "cubic-bezier(0.22, 1, 0.36, 1)",
  /** Standard in-out for toggles */
  inOut: "cubic-bezier(0.4, 0, 0.2, 1)",
} as const;

/** Framer Motion compatible easing tuples */
export const MOTION_EASE_FM = {
  out: [0.22, 1, 0.36, 1] as const,
  inOut: [0.4, 0, 0.2, 1] as const,
} as const;

/** Shared CSS utility class names (defined in globals.css) */
export const motionClass = {
  overlay: "motion-overlay",
  modalContent: "motion-modal-content",
  dropdown: "motion-dropdown",
  toast: "motion-toast",
  reveal: "motion-reveal",
  buttonPress: "motion-button-press",
  enterOverlay: "motion-enter-overlay",
  enterSheet: "motion-enter-sheet",
} as const;

const REVEAL_DELAYS: Record<string, string> = {
  "100": "motion-reveal-delay-100",
  "200": "motion-reveal-delay-200",
  "300": "motion-reveal-delay-300",
};

/** Scroll-reveal class with optional stagger delay */
export function motionRevealClass(delayMs?: 100 | 200 | 300): string {
  const delay = delayMs ? REVEAL_DELAYS[String(delayMs)] : "";
  return [motionClass.reveal, delay].filter(Boolean).join(" ");
}

/** Client-side reduced-motion check (SSR-safe default: false) */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Framer Motion transition with reduced-motion fallback */
export function motionTransition(
  durationMs: number = MOTION_DURATION.base,
  ease: readonly [number, number, number, number] = MOTION_EASE_FM.out
) {
  if (prefersReducedMotion()) {
    return { duration: 0 };
  }
  return { duration: durationMs / 1000, ease };
}

/** Standard fade + slide-up variant for framer-motion */
export const fadeSlideUpVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
} as const;

/** Standard scale-in variant for framer-motion */
export const scaleInVariants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1 },
} as const;
