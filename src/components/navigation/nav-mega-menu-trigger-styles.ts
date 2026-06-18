import { cn } from "@/lib/cn";

export const navMegaMenuTriggerClassName =
  "group relative inline-flex max-w-[6.75rem] items-baseline gap-0.5 truncate px-0.5 py-1 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40 lg:text-[13px] xl:max-w-none xl:px-1 xl:text-sm";

export function navMegaMenuIndexClassName(compact: boolean): string {
  return cn(
    "text-[10px] font-normal text-gray-400 group-hover:text-sky/70",
    compact && "hidden xl:inline"
  );
}
