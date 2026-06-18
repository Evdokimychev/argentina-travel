import { Skeleton } from "@/components/ui/skeleton";

export default function BookingTokenPageSkeleton() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14" aria-busy="true" aria-live="polite">
      <span className="sr-only">Загружаем страницу бронирования…</span>
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <Skeleton className="h-7 w-56 max-w-full" />
        <Skeleton className="mt-3 h-4 w-full max-w-md" />
        <Skeleton className="mt-6 h-32 w-full rounded-xl" />
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
        <Skeleton className="mt-6 h-11 w-full rounded-xl sm:w-48" />
      </div>
    </div>
  );
}
