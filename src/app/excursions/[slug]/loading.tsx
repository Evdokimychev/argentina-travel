import { siteContainerClass } from "@/lib/site-container";
import { Skeleton } from "@/components/ui/skeleton";

export default function ExcursionDetailLoading() {
  return (
    <div className={`${siteContainerClass} py-8`} aria-busy="true" aria-live="polite">
      <span className="sr-only">Загружаем экскурсию…</span>

      <Skeleton className="h-4 w-40" />

      <div className="mt-6 grid gap-2 sm:grid-cols-3">
        <Skeleton className="aspect-[4/3] rounded-2xl sm:col-span-2 sm:aspect-[16/10]" />
        <div className="hidden flex-col gap-2 sm:flex">
          <Skeleton className="flex-1 rounded-2xl" />
          <Skeleton className="flex-1 rounded-2xl" />
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-4">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-10 w-full max-w-2xl" />
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="mt-6 h-48 w-full rounded-2xl lg:hidden" />
          <div className="mt-6 space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-4 w-full" />
            ))}
          </div>
        </div>
        <Skeleton className="hidden h-72 rounded-2xl lg:block" />
      </div>
    </div>
  );
}
