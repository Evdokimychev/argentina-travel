/** Shared layout tokens for tourist & organizer personal cabinets */

export const cabinetShellClass =
  "min-h-[calc(100vh-var(--site-header-height,72px))] bg-surface-muted";

export const cabinetContentGapClass = "flex items-start gap-5 py-5 md:py-6";

export const cabinetPanelClass =
  "rounded-3xl border border-gray-100 bg-white p-5 shadow-card sm:p-6";

export const cabinetCardClass =
  "rounded-3xl border border-gray-100 bg-white shadow-card";

export const cabinetHeroClass =
  "rounded-3xl border border-gray-100 bg-gradient-to-br from-white via-white to-sky/[0.06] p-5 shadow-card sm:p-6";

export const cabinetLinkClass =
  "font-medium text-sky transition-colors hover:text-sky-dark hover:underline";

export const cabinetSidebarClass =
  "sticky top-[calc(var(--site-header-height,72px)+1rem)] hidden h-fit shrink-0 flex-col rounded-3xl border border-gray-100 bg-white shadow-card transition-[width] duration-300 ease-out md:flex";

export const cabinetSidebarSkeletonClass =
  "sticky top-[calc(var(--site-header-height,72px)+1rem)] h-fit rounded-3xl border border-gray-100 bg-white shadow-card";

export const cabinetMobileHeaderClass =
  "flex items-center justify-between border-b border-gray-100 bg-white/95 px-4 py-3 backdrop-blur-md md:hidden";

export const cabinetMobileNavClass =
  "scrollbar-hide flex gap-1 overflow-x-auto border-b border-gray-100 bg-white px-3 py-2 md:hidden";

export const cabinetNavBadgeClass =
  "flex items-center justify-center rounded-full bg-sky font-bold text-white";

export const cabinetPageTitleClass = "font-heading text-xl font-bold text-charcoal sm:text-2xl";

export const cabinetPageSubtitleClass = "mt-1 text-sm text-slate";

export const cabinetStatCardClass =
  "rounded-3xl border border-gray-100 bg-white p-5 shadow-card transition-[border-color,box-shadow] hover:border-sky/30 hover:shadow-elevated motion-reduce:transition-none";

export const cabinetTableWrapClass =
  "overflow-x-auto rounded-3xl border border-gray-100";

export const cabinetTableHeaderClass = "bg-surface-muted/70";

export const cabinetNavActiveClass = "bg-sky/10 text-sky ring-1 ring-sky/15";

export const cabinetNavIdleClass =
  "text-slate hover:bg-gray-50 hover:text-charcoal";
