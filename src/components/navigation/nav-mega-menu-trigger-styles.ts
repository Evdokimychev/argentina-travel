import { cn } from "@/lib/cn";

export const navMegaMenuTriggerClassName =
  "group relative inline-flex max-w-full items-baseline gap-0.5 truncate px-0.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40 lg:text-[12px] xl:text-[13px] 2xl:text-sm";

/** Overflow «Ещё» — compact trigger; preview lives in the dropdown panel only. */
export const navOverflowTriggerClassName =
  "group relative inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40 lg:text-[12px] xl:px-2 xl:text-[13px] 2xl:text-sm";

export function navMegaMenuIndexClassName(compact: boolean): string {
  return cn(
    "text-[10px] font-normal text-gray-400 group-hover:text-sky/70",
    compact && "hidden 2xl:inline"
  );
}
