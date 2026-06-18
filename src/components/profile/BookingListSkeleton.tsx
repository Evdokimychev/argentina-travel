import { Skeleton } from "@/components/ui/skeleton";
import { cabinetCardClass } from "@/lib/cabinet-ui";
import { cn } from "@/lib/cn";

export default function BookingListSkeleton() {
  return (
    <div className="mt-6 space-y-4" aria-busy="true" aria-live="polite">
      <span className="sr-only">Загружаем бронирования…</span>
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className={cn(cabinetCardClass, "overflow-hidden")}>
          <div className="flex flex-col sm:flex-row">
            <Skeleton className="aspect-[16/9] w-full sm:aspect-auto sm:h-28 sm:w-44 sm:shrink-0 sm:rounded-none" />
            <div className="flex min-w-0 flex-1 flex-col gap-3 p-4 sm:p-5">
              <Skeleton className="h-5 w-3/4 max-w-xs" />
              <Skeleton className="h-4 w-1/2 max-w-[200px]" />
              <Skeleton className="h-3 w-1/3 max-w-[140px]" />
              <div className="mt-auto flex justify-between pt-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
