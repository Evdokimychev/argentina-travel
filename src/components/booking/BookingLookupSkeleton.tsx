import { Skeleton } from "@/components/ui/skeleton";

export default function BookingLookupSkeleton() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14" aria-busy="true" aria-live="polite">
      <span className="sr-only">Загружаем форму поиска заявки…</span>
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <Skeleton className="h-8 w-48 max-w-full" />
        <Skeleton className="mt-3 h-4 w-full max-w-lg" />
        <Skeleton className="mt-2 h-4 w-4/5 max-w-md" />
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Skeleton className="h-10 min-w-0 flex-1 rounded-xl" />
          <Skeleton className="h-10 w-full shrink-0 rounded-xl sm:w-28" />
        </div>
        <Skeleton className="mt-6 h-24 w-full rounded-xl" />
      </div>
    </div>
  );
}
