import { cn } from "@/lib/cn";

export function floatingChromeButtonClass(onDark: boolean, className?: string) {
  return cn(
    "flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-sm transition-colors duration-200",
    onDark
      ? "bg-white/25 text-white shadow-md ring-1 ring-white/35 hover:bg-white/40 hover:text-white"
      : "bg-charcoal/10 text-charcoal/70 shadow-sm ring-1 ring-charcoal/10 hover:bg-charcoal/18 hover:text-charcoal",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40 focus-visible:ring-offset-2",
    className
  );
}
