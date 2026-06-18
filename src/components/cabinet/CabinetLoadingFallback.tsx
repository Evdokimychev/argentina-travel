import { Skeleton } from "@/components/ui/skeleton";
import { cabinetPanelClass } from "@/lib/cabinet-ui";
import { cn } from "@/lib/cn";

export default function CabinetLoadingFallback({ title = "Загружаем…" }: { title?: string }) {
  return (
    <div className={cn(cabinetPanelClass)} aria-busy="true" aria-live="polite">
      <span className="sr-only">{title}</span>
      <Skeleton className="h-8 w-56 max-w-full" />
      <Skeleton className="mt-3 h-4 w-80 max-w-full" />
      <div className="mt-8 space-y-4">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    </div>
  );
}
