import { cn } from "@/lib/cn";

/** Shared desktop mega-menu trigger row — keep all items on one optical baseline. */
export const navMegaMenuTriggerClassName =
  "group relative inline-flex h-8 max-w-full items-center gap-1 truncate px-1 text-xs font-medium leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40 lg:text-[12px] xl:text-[13px] 2xl:text-sm";

/** Overflow «Ещё» — same height/alignment as primary triggers. */
export const navOverflowTriggerClassName =
  "group relative inline-flex h-8 items-center gap-1 rounded-lg px-1.5 text-xs font-medium leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40 lg:text-[12px] xl:px-2 xl:text-[13px] 2xl:text-sm";

export function navMegaMenuIndexClassName(compact: boolean): string {
  return cn(
    "ml-0.5 shrink-0 text-[10px] font-normal tabular-nums leading-none text-foreground/35 group-hover:text-sky/60",
    compact && "hidden 2xl:inline",
  );
}

export const navMegaMenuChevronClassName =
  "h-3 w-3 shrink-0 text-current opacity-40 transition-transform duration-200 group-hover:opacity-65";

export const navMegaMenuChevronButtonClassName =
  "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-current transition-colors hover:bg-sky/10 hover:text-sky focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40";
