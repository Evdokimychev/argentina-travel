import { cn } from "@/lib/cn";

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-charcoal placeholder:text-gray-400 focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/20 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}
