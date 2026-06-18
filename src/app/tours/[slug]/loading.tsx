import { siteContainerClass } from "@/lib/site-container";

export default function TourDetailLoading() {
  return (
    <div className={`${siteContainerClass} py-8`} aria-busy="true" aria-live="polite">
      <span className="sr-only">Загружаем путешествие…</span>

      {/* Gallery */}
      <div className="grid gap-2 sm:grid-cols-3">
        <div className="aspect-[4/3] animate-pulse rounded-2xl bg-charcoal/5 sm:col-span-2 sm:aspect-[16/10]" />
        <div className="hidden flex-col gap-2 sm:flex">
          <div className="flex-1 animate-pulse rounded-2xl bg-charcoal/5" />
          <div className="flex-1 animate-pulse rounded-2xl bg-charcoal/5" />
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <div className="h-9 w-3/4 animate-pulse rounded-lg bg-charcoal/5" />
          <div className="h-4 w-1/3 animate-pulse rounded bg-charcoal/5" />
          <div className="mt-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-4 w-full animate-pulse rounded bg-charcoal/5" />
            ))}
          </div>
        </div>
        <div className="h-64 animate-pulse rounded-2xl bg-charcoal/5" />
      </div>
    </div>
  );
}
