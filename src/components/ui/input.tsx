import { cn } from "@/lib/cn";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "flex h-11 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-charcoal placeholder:text-gray-400 focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/20",
        className
      )}
      {...props}
    />
  );
}
