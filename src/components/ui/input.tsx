import { cn } from "@/lib/cn";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "flex h-11 w-full rounded-button border border-border-subtle bg-surface-elevated px-4 py-2 text-sm text-foreground placeholder:text-slate/70 focus-visible:border-sky focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40 aria-invalid:border-error aria-invalid:ring-error/20",
        className
      )}
      {...props}
    />
  );
}
