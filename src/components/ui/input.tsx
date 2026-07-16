import { cn } from "@/lib/cn";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "ym-disable-keys flex h-11 w-full rounded-button border border-border-subtle bg-surface-elevated px-4 py-2 text-sm text-foreground shadow-[0_1px_0_rgba(15,23,42,0.02)] transition-[border-color,box-shadow,background-color] placeholder:text-slate/70 hover:border-slate/35 focus-visible:border-sky focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/30 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-muted disabled:opacity-70 read-only:bg-surface-muted/70 aria-invalid:border-error aria-invalid:bg-error-muted/30 aria-invalid:ring-2 aria-invalid:ring-error/15",
        className
      )}
      {...props}
    />
  );
}
