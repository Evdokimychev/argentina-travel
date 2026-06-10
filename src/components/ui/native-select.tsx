import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export function NativeSelect({
  className,
  wrapperClassName,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  wrapperClassName?: string;
}) {
  return (
    <div className={cn("relative", wrapperClassName)}>
      <select
        className={cn(
          "flex h-11 w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2 pr-10 text-sm text-charcoal focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/20 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate"
        aria-hidden
      />
    </div>
  );
}
