import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export function LoadingSpinner({
  className,
  label = "Загрузка",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <Loader2
      className={cn("h-4 w-4 animate-spin", className)}
      aria-hidden
      role="status"
      aria-label={label}
    />
  );
}
