import { cn } from "@/lib/cn";
import { siteContainerClass } from "@/lib/site-container";
import {
  cabinetCardClass,
  cabinetPanelClass,
  cabinetTableHeaderClass,
  cabinetTableWrapClass,
} from "@/lib/cabinet-ui";

export type SkeletonVariant = "catalog" | "cabinet" | "admin";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-charcoal/[0.06]", className)}
      aria-hidden
    />
  );
}

/* ── Catalog ─────────────────────────────────────────────── */

export function CatalogCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-4/5" />
        <div className="flex justify-between pt-1">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-14" />
        </div>
      </div>
    </div>
  );
}

export function CatalogLoadingFallback({ title = "Загружаем каталог…" }: { title?: string }) {
  return (
    <div className={cn(siteContainerClass, "py-10")} aria-busy="true" aria-live="polite">
      <span className="sr-only">{title}</span>
      <Skeleton className="h-9 w-64 max-w-full" />
      <Skeleton className="mt-3 h-4 w-96 max-w-full" />
      <Skeleton className="mt-8 h-14 w-full rounded-2xl" />
      <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <CatalogCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

/* ── Cabinet ─────────────────────────────────────────────── */

export function CabinetBookingCardSkeleton() {
  return (
    <div className={cn(cabinetCardClass, "overflow-hidden")}>
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
  );
}

export function CabinetBookingListSkeleton({
  count = 3,
  className,
  title = "Загружаем бронирования…",
}: {
  count?: number;
  className?: string;
  title?: string;
}) {
  return (
    <div className={cn("space-y-4", className)} aria-busy="true" aria-live="polite">
      <span className="sr-only">{title}</span>
      {Array.from({ length: count }).map((_, index) => (
        <CabinetBookingCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function CabinetInboxItemSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex gap-3 px-4 py-3">
      <Skeleton className={cn("shrink-0 rounded-xl", compact ? "h-7 w-7" : "h-8 w-8")} />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3 max-w-[200px]" />
        <Skeleton className="h-3 w-full max-w-[280px]" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

export function CabinetInboxListSkeleton({
  count = 4,
  compact = false,
  title = "Загружаем уведомления…",
  className,
}: {
  count?: number;
  compact?: boolean;
  title?: string;
  className?: string;
}) {
  return (
    <ul
      className={cn("divide-y divide-gray-100 rounded-2xl border border-gray-100", className)}
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">{title}</span>
      {Array.from({ length: count }).map((_, index) => (
        <li key={index}>
          <CabinetInboxItemSkeleton compact={compact} />
        </li>
      ))}
    </ul>
  );
}

export function CabinetDashboardSkeleton({ title = "Загружаем обзор…" }: { title?: string }) {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">{title}</span>
      <Skeleton className="h-14 w-full rounded-3xl" />
      <div className={cabinetPanelClass}>
        <Skeleton className="h-8 w-56 max-w-full" />
        <Skeleton className="mt-3 h-4 w-80 max-w-full" />
        <div className="mt-4 flex flex-wrap gap-2">
          <Skeleton className="h-7 w-32 rounded-full" />
          <Skeleton className="h-7 w-36 rounded-full" />
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className={cabinetPanelClass}>
          <Skeleton className="h-6 w-28" />
          <CabinetInboxListSkeleton count={3} className="mt-4" />
        </div>
        <div className={cabinetPanelClass}>
          <Skeleton className="h-6 w-32" />
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-32 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-24 rounded-3xl" />
        ))}
      </div>
    </div>
  );
}

export function CabinetLoadingFallback({ title = "Загружаем…" }: { title?: string }) {
  return (
    <div className={cn(cabinetPanelClass)} aria-busy="true" aria-live="polite">
      <span className="sr-only">{title}</span>
      <Skeleton className="h-8 w-56 max-w-full" />
      <Skeleton className="mt-3 h-4 w-80 max-w-full" />
      <CabinetBookingListSkeleton count={3} className="mt-8" />
    </div>
  );
}

/* ── Admin ───────────────────────────────────────────────── */

export function AdminTableRowsSkeleton({
  columns,
  rows = 5,
}: {
  columns: number;
  rows?: number;
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} className="align-top">
          {Array.from({ length: columns }).map((__, colIndex) => (
            <td key={colIndex} className="px-4 py-3">
              <Skeleton
                className={cn(
                  "h-4",
                  colIndex === 0 ? "w-40" : colIndex === columns - 1 ? "w-20" : "w-24"
                )}
              />
              {colIndex === 0 ? <Skeleton className="mt-2 h-3 w-28" /> : null}
            </td>
          ))}
        </tr>
      ))}
      <span className="sr-only">Загрузка таблицы…</span>
    </>
  );
}

export function AdminTableSkeleton({
  columns,
  rows = 5,
  headers,
  minWidth = 720,
  title = "Загружаем данные…",
  className,
}: {
  columns: number;
  rows?: number;
  headers?: string[];
  minWidth?: number;
  title?: string;
  className?: string;
}) {
  const resolvedHeaders =
    headers ?? Array.from({ length: columns }).map((_, index) => `col-${index}`);

  return (
    <div className={cn(cabinetTableWrapClass, className)} aria-busy="true" aria-live="polite">
      <span className="sr-only">{title}</span>
      <table className="w-full text-left text-sm" style={{ minWidth }}>
        <thead className={cabinetTableHeaderClass}>
          <tr>
            {resolvedHeaders.map((header) => (
              <th key={header} className="px-4 py-3 font-medium text-slate">
                <Skeleton className="h-4 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          <AdminTableRowsSkeleton columns={columns} rows={rows} />
        </tbody>
      </table>
    </div>
  );
}

export function AdminListSkeleton({
  rows = 5,
  title = "Загружаем список…",
  className,
}: {
  rows?: number;
  title?: string;
  className?: string;
}) {
  return (
    <ul className={cn("divide-y divide-gray-100", className)} aria-busy="true" aria-live="polite">
      <span className="sr-only">{title}</span>
      {Array.from({ length: rows }).map((_, index) => (
        <li key={index} className="space-y-2 px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-3 w-64 max-w-full" />
          <Skeleton className="h-3 w-28" />
        </li>
      ))}
    </ul>
  );
}
