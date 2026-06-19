import { siteStickyBelowHeaderInsetClass } from "@/lib/site-container";

/** Shared layout tokens for tourist & organizer personal cabinets */

export const cabinetShellClass =
  "min-h-[calc(100vh-var(--site-header-full-height,72px))] bg-surface-muted dark:bg-background";

export const cabinetContentGapClass = "flex items-start gap-5 py-5 md:py-6";

export const cabinetPanelClass =
  "rounded-3xl border border-border-subtle bg-surface-elevated p-5 shadow-card sm:p-6 dark:border-border-subtle dark:bg-surface-elevated";

export const cabinetCardClass =
  "rounded-3xl border border-border-subtle bg-surface-elevated shadow-card dark:border-border-subtle dark:bg-surface-elevated";

export const cabinetHeroClass =
  "rounded-3xl border border-border-subtle bg-gradient-to-br from-surface-elevated via-surface-elevated to-sky/[0.06] p-5 shadow-card sm:p-6 dark:from-surface-elevated dark:via-surface-elevated dark:to-sky/[0.08]";

export const cabinetLinkClass =
  "font-medium text-sky transition-colors hover:text-sky-dark hover:underline";

export const cabinetSidebarClass =
  `sticky hidden h-fit shrink-0 flex-col rounded-3xl border border-border-subtle bg-surface-elevated shadow-card transition-[width] duration-300 ease-out md:flex dark:border-border-subtle dark:bg-surface-elevated ${siteStickyBelowHeaderInsetClass}`;

export const cabinetSidebarSkeletonClass =
  `sticky h-fit rounded-3xl border border-border-subtle bg-surface-elevated shadow-card dark:border-border-subtle dark:bg-surface-elevated ${siteStickyBelowHeaderInsetClass}`;

export const cabinetMobileHeaderClass =
  "flex items-center justify-between border-b border-border-subtle bg-surface-elevated/95 px-4 py-3 backdrop-blur-md md:hidden dark:border-border-subtle dark:bg-surface-elevated/95";

export const cabinetMobileNavClass =
  "scrollbar-hide flex gap-1 overflow-x-auto border-b border-border-subtle bg-surface-elevated px-3 py-2 md:hidden dark:border-border-subtle dark:bg-surface-elevated";

export const cabinetMobileBottomNavClass =
  "fixed inset-x-0 bottom-0 z-40 border-t border-border-subtle bg-surface-elevated/95 px-2 pt-2 pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] backdrop-blur-md md:hidden dark:border-border-subtle dark:bg-surface-elevated/95";

export const cabinetMobileBottomInsetClass =
  "pb-[calc(4.75rem+env(safe-area-inset-bottom,0px))] md:pb-0";

export const cabinetNavBadgeClass =
  "flex items-center justify-center rounded-full bg-sky font-bold text-white";

export const cabinetPageTitleClass =
  "font-heading text-xl font-bold text-foreground sm:text-2xl";

export const cabinetPageSubtitleClass = "mt-1 text-sm text-muted";

export const cabinetStatCardClass =
  "rounded-3xl border border-border-subtle bg-surface-elevated p-5 shadow-card transition-[border-color,box-shadow] hover:border-sky/30 hover:shadow-elevated motion-reduce:transition-none dark:border-border-subtle dark:bg-surface-elevated";

export const cabinetWidgetCardClass =
  "rounded-3xl border border-border-subtle bg-surface-elevated p-5 shadow-card transition-[border-color,box-shadow] hover:border-sky/25 hover:shadow-elevated motion-reduce:transition-none dark:border-border-subtle dark:bg-surface-elevated";

export const cabinetQuickActionsClass =
  "flex gap-2 overflow-x-auto pb-1 scrollbar-hide sm:flex-wrap sm:overflow-visible";

export const cabinetQuickActionClass =
  "inline-flex shrink-0 items-center gap-2 rounded-2xl border border-border-subtle bg-surface-elevated px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition-[border-color,box-shadow,background-color] hover:border-sky/25 hover:bg-sky/[0.04] hover:shadow-card motion-reduce:transition-none dark:border-border-subtle dark:bg-surface-elevated dark:hover:bg-sky/[0.06]";

export const cabinetTableWrapClass =
  "overflow-x-auto rounded-3xl border border-border-subtle dark:border-border-subtle";

export const cabinetTableHeaderClass = "bg-surface-muted/70 dark:bg-surface-muted/50";

export const cabinetNavActiveClass =
  "bg-sky/10 font-semibold text-sky shadow-sm ring-1 ring-sky/20 before:absolute before:left-0 before:top-1/2 before:h-5 before:w-1 before:-translate-y-1/2 before:rounded-r-full before:bg-sky";

export const cabinetNavIdleClass =
  "text-muted hover:bg-surface-muted hover:text-foreground dark:hover:bg-surface-muted/80";

export const cabinetNavLinkClass = "relative";

export const cabinetBorderDividerClass = "border-border-subtle dark:border-border-subtle";

export const cabinetSurfaceButtonClass =
  "rounded-xl border border-border-subtle bg-surface-elevated text-muted transition-colors hover:bg-surface-muted hover:text-foreground dark:border-border-subtle dark:bg-surface-elevated dark:hover:bg-surface-muted/80";

export const cabinetMutedSurfaceClass =
  "border-border-subtle bg-surface-muted dark:border-border-subtle dark:bg-surface-muted/80";
