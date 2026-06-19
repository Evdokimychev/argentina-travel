import { cn } from "@/lib/cn";

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "hot" | "new" | "hit" | "family" | "expedition" | "outline";
}) {
  const variants = {
    default: "bg-gray-100 text-charcoal",
    hot: "bg-brand text-white",
    new: "bg-sky text-white",
    hit: "bg-wine text-white",
    family: "bg-success-muted text-success",
    expedition: "bg-charcoal text-white",
    outline: "border border-gray-200 bg-white/90 text-charcoal backdrop-blur-sm",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
