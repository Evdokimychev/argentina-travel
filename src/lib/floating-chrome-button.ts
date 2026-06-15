import { cn } from "@/lib/cn";

/** Единый отступ fixed-кнопок у левого края (поиск, наверх). */
export const floatingChromeInsetClass = "left-3";

export function floatingChromeButtonClass(onDark: boolean, className?: string) {
  return cn(
    "flex h-10 w-10 items-center justify-center rounded-full border shadow-sm backdrop-blur-md transition-colors duration-200",
    onDark
      ? cn(
          "border-white/20 bg-white/10 text-white",
          "hover:border-sky/40 hover:bg-white/15 hover:text-white",
          "group-hover:border-sky/40 group-hover:bg-white/15 group-hover:text-white"
        )
      : cn(
          "border-gray-200 bg-white/95 text-charcoal",
          "hover:border-sky/30 hover:bg-sky/5 hover:text-sky",
          "group-hover:border-sky/30 group-hover:bg-sky/5 group-hover:text-sky"
        ),
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40 focus-visible:ring-offset-2",
    className
  );
}
