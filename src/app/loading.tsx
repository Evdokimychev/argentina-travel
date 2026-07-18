import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";
import { siteContainerClass } from "@/lib/site-container";

export default function RootLoading() {
  return (
    <main
      className="min-h-[calc(100vh-var(--site-header-full-height,72px))] bg-background"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Загружаем страницу…</span>
      <div className={cn(siteContainerClass, "py-8 sm:py-12 lg:py-16")}>
        <Skeleton className="h-6 w-36 rounded-full" />
        <div className="mt-5 grid items-stretch gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(420px,1.2fr)]">
          <div className="flex flex-col justify-center py-4">
            <Skeleton className="h-12 w-full max-w-xl rounded-xl sm:h-16" />
            <Skeleton className="mt-3 h-12 w-4/5 max-w-lg rounded-xl sm:h-16" />
            <Skeleton className="mt-6 h-4 w-full max-w-xl" />
            <Skeleton className="mt-2 h-4 w-2/3 max-w-md" />
            <div className="mt-7 flex gap-3">
              <Skeleton className="h-11 w-40 rounded-full" />
              <Skeleton className="h-11 w-28 rounded-full" />
            </div>
          </div>
          <Skeleton className="aspect-[4/3] min-h-64 w-full rounded-[2rem] lg:aspect-[16/11]" />
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-border-subtle bg-surface-elevated p-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="mt-3 h-6 w-3/4" />
              <Skeleton className="mt-2 h-3 w-full" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
