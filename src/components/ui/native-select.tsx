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
          "flex h-11 w-full appearance-none rounded-button border border-border-subtle bg-surface-elevated px-4 py-2 pr-10 text-sm text-foreground shadow-[0_1px_0_rgba(15,23,42,0.02)] transition-[border-color,box-shadow,background-color] hover:border-slate/35 focus-visible:border-sky focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/30 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-muted disabled:opacity-70 aria-invalid:border-error aria-invalid:bg-error-muted/30 aria-invalid:ring-2 aria-invalid:ring-error/15",
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
