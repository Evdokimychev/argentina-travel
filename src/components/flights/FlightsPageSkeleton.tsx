import { Skeleton } from "@/components/ui/skeleton";
import { siteContainerClass } from "@/lib/site-container";
import { cn } from "@/lib/cn";

export default function FlightsPageSkeleton() {
  return (
    <div className="w-full" aria-busy="true" aria-live="polite">
      <span className="sr-only">Загружаем поиск перелётов…</span>
      <Skeleton className="h-48 w-full rounded-none sm:h-56" />
      <div className={cn(siteContainerClass, "py-10 sm:py-14")}>
        <Skeleton className="h-7 w-64 max-w-full" />
        <Skeleton className="mt-3 h-4 w-full max-w-2xl" />
        <Skeleton className="mt-6 h-[420px] w-full rounded-2xl" />
        <div className="mt-12 grid gap-4 border-t border-gray-100 pt-10 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
