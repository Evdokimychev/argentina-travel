/** Mobile-first responsive utilities (Sprint 2). */

/** Prevent horizontal page scroll from 100vw popovers / mega menus. */
export const viewportClipClass = "max-w-full overflow-x-clip";

/** WCAG 2.5.5 — minimum 44×44px touch target. */
export const touchTargetMinClass = "min-h-11 min-w-11";

/** Icon-only control with 44px hit area. */
export const touchTargetIconClass =
  "inline-flex h-11 w-11 shrink-0 items-center justify-center";

/** Shared height contract for the public mobile app navigation. */
export const publicMobileNavHeightClass =
  "[--public-mobile-nav-height:4.75rem] md:[--public-mobile-nav-height:0px]";

/** Keeps public content and the footer clear of the fixed mobile navigation. */
export const publicMobileNavInsetClass =
  "pb-[calc(var(--public-mobile-nav-height,0px)+env(safe-area-inset-bottom,0px))] md:pb-0";

/** Public mobile app navigation shell, coordinated with the cookie banner. */
export const publicMobileBottomNavClass =
  "fixed inset-x-0 [bottom:var(--cookie-consent-offset,0px)] z-30 border-t border-border-subtle bg-surface-elevated/95 px-[max(0.25rem,env(safe-area-inset-left,0px))] pt-1.5 pb-[calc(env(safe-area-inset-bottom,0px)+0.375rem)] shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur-md transition-[bottom] duration-200 md:hidden";

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
