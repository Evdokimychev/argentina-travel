/** Mobile-first responsive utilities (Sprint 2). */

/** Prevent horizontal page scroll from 100vw popovers / mega menus. */
export const viewportClipClass = "max-w-full overflow-x-clip";

/** WCAG 2.5.5 — minimum 44×44px touch target. */
export const touchTargetMinClass = "min-h-11 min-w-11";

/** Icon-only control with 44px hit area. */
export const touchTargetIconClass =
  "inline-flex h-11 w-11 shrink-0 items-center justify-center";

/** Popover / panel max width safe for 320px–430px viewports. */
export const viewportSafePopoverWidthClass = "max-w-[min(100%,calc(100dvw-2rem))]";

/** Matches siteContainerClass horizontal padding (px-4 → 1rem per side). */
export const sitePopoverWidthClass = "w-[calc(100dvw-2rem)]";

/**
 * Mobile popover shell: full content width, centered by PopoverContent, keyboard-safe height.
 * Uses dvh + keyboard inset where supported.
 */
export const mobilePopoverContentClass =
  "max-sm:w-[calc(100dvw-2rem)] max-sm:min-w-[calc(100dvw-2rem)] max-sm:max-w-[calc(100dvw-2rem)] max-sm:max-h-[min(70dvh,calc(100dvh-env(keyboard-inset-height,0px)-5rem))] max-sm:overflow-y-auto max-sm:overscroll-contain";

/** Desktop: at least trigger width, grow with content, capped to viewport. */
export const desktopPopoverContentClass =
  "sm:w-auto sm:min-w-[var(--radix-popover-trigger-width)] sm:max-w-[min(100%,calc(100dvw-2rem))]";

export const popoverContentShellClass = `${mobilePopoverContentClass} ${desktopPopoverContentClass}`;

/** Scrollable popover body — respects virtual keyboard on mobile. */
export const popoverScrollMaxHeightClass =
  "max-h-[min(70dvh,calc(100dvh-env(keyboard-inset-height,0px)-5rem),var(--radix-popover-content-available-height))] overflow-y-auto overscroll-contain";

/** @deprecated Use popoverContentShellClass via ui/popover instead. */
export const filterPopoverMobileFullWidthClass = mobilePopoverContentClass;

/** Mega menu / wide panel width without scrollbar gutter overflow. */
export function megaMenuPanelWidthClass(maxRem: number): string {
  return `w-[min(calc(100dvw-2rem),${maxRem}rem)]`;
}
