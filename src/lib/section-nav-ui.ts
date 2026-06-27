import { cn } from "@/lib/cn";

/** Общая «капсула» для горизонтального меню разделов страницы. */
export const sectionNavTrackClass =
  "flex w-full min-w-max items-center justify-start gap-0.5 rounded-full border border-gray-200 bg-gray-50/90 p-1 shadow-sm";

export function sectionNavLinkClass(active: boolean, withTouchTarget = false) {
  return cn(
    withTouchTarget
      ? "inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium whitespace-nowrap transition-colors sm:min-h-0 sm:py-1.5"
      : "inline-flex items-center rounded-full px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
    active
      ? "bg-sky text-white shadow-sm"
      : "text-charcoal hover:bg-white/90 hover:text-sky"
  );
}

export const sectionNavBarClass =
  "sticky z-40 w-full border-b border-gray-100 bg-white/95 backdrop-blur-md";
