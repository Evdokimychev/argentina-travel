import { cn } from "@/lib/cn";

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-charcoal placeholder:text-slate/70 focus-visible:border-sky focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-error aria-invalid:ring-error/20",
        className
      )}
      {...props}
    />
  );
}
