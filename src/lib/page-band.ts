import { cn } from "@/lib/cn";

/** Flat gray page title band — ref. contacts hero (~#f2f2f2). */
export const pageBandSectionClass = cn(
  "relative overflow-hidden border-b border-border-subtle bg-page-band",
  "dark:border-border-subtle dark:bg-background",
);

/** Gradient hero band — exceptions: homepage, marketing accents. */
export const pageBandAccentSectionClass =
  "relative overflow-hidden border-b border-gray-100 bg-gradient-to-br from-surface-muted via-white to-sky/[0.06]";

/** Decorative blurs paired with `pageBandAccentSectionClass`. */
export const pageBandAccentBlurTopClass =
  "pointer-events-none absolute -right-16 top-8 h-56 w-56 rounded-full bg-sky/10 blur-3xl";

export const pageBandAccentBlurBottomClass =
  "pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-sun/10 blur-3xl";
