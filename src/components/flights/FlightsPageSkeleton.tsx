import { Skeleton } from "@/components/ui/skeleton";
import { siteContainerClass } from "@/lib/site-container";
import { cn } from "@/lib/cn";
import "./flights-page.css";

export default function FlightsPageSkeleton() {
  return (
    <div className="flights-page-root w-full bg-[#f8fafc]" aria-busy="true" aria-live="polite">
      <span className="sr-only">Загружаем поиск авиабилетов…</span>

      <header className="flights-page-hero border-b border-gray-100/80">
        <div className={cn(siteContainerClass, "py-8 sm:py-10 lg:py-11")}>
          <Skeleton className="h-9 w-72 max-w-full sm:h-10" />
          <Skeleton className="mt-3 h-5 w-full max-w-md" />
        </div>
      </header>

      <div className={cn(siteContainerClass, "pb-14 pt-5 sm:pb-16 sm:pt-6")}>
        <Skeleton className="h-[220px] w-full rounded-[1.25rem] sm:h-[180px]" />
        <div className="mt-10 border-t border-gray-100 pt-8">
          <Skeleton className="h-5 w-48" />
          <div className="mt-4 flex flex-wrap gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-44 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
