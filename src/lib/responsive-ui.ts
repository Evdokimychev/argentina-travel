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

/** Mega menu / wide panel width without scrollbar gutter overflow. */
export function megaMenuPanelWidthClass(maxRem: number): string {
  return `w-[min(calc(100dvw-2rem),${maxRem}rem)]`;
}
