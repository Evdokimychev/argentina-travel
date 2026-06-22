import Link from "next/link";
import { ArrowRight, Route } from "lucide-react";
import { BLOG_POPULAR_ROUTES } from "@/data/blog-popular-routes";
import { cn } from "@/lib/cn";

type BlogPopularRoutesProps = {
  className?: string;
};

export default function BlogPopularRoutes({ className }: BlogPopularRoutesProps) {
  return (
    <section className={cn(className)} aria-labelledby="blog-popular-routes-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            id="blog-popular-routes-title"
            className="font-heading text-xl font-bold text-charcoal sm:text-2xl"
          >
            Популярные маршруты
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-slate">
            Готовые планы на 5–14 дней и справочники для подготовки
          </p>
        </div>
        <Link
          href="/blog/hub/putevoditel"
          className="inline-flex items-center gap-1 text-sm font-semibold text-sky hover:underline"
        >
          Раздел «Путеводитель»
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {BLOG_POPULAR_ROUTES.map((route) => (
          <li key={route.slug}>
            <Link
              href={route.href}
              className="group flex min-h-[44px] items-start gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-card transition-all hover:-translate-y-0.5 hover:border-sky/25 hover:shadow-lg motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <Route className="h-5 w-5" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="block font-heading text-sm font-bold text-charcoal group-hover:text-sky sm:text-base">
                    {route.title}
                  </span>
                  <span className="rounded-full bg-surface-muted px-2 py-0.5 text-2xs font-semibold uppercase tracking-wide text-slate">
                    {route.duration}
                  </span>
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-slate">{route.subtitle}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
