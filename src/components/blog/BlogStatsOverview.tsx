import { BookMarked, Clock, Layers, PenLine } from "lucide-react";
import type { BlogIndexStats } from "@/lib/blog-utils";
import { cn } from "@/lib/cn";

type EditorialProgress = {
  planTotal: number;
  written: number;
  remaining: number;
  percent: number;
  byCategory: Record<string, number>;
};

type BlogStatsOverviewProps = {
  stats: BlogIndexStats;
  editorialCount: number;
  editorialProgress?: EditorialProgress;
  className?: string;
};

export default function BlogStatsOverview({
  stats,
  editorialCount,
  editorialProgress,
  className,
}: BlogStatsOverviewProps) {
  const topicCount = stats.categories.length;
  const topCategories = stats.categories.slice(0, 5);
  const maxCount = topCategories[0]?.count ?? 1;

  return (
    <div className={className}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          icon={BookMarked}
          label="В каталоге"
          value={stats.totalPosts.toLocaleString("ru-RU")}
          hint="тематических материалов"
        />
        <StatTile
          icon={Layers}
          label="Тематик"
          value={String(topicCount)}
          hint="регионы, задачи, практика"
        />
        <StatTile
          icon={PenLine}
          label="Редакция"
          value={String(editorialCount)}
          hint="обновляем вручную"
        />
        <StatTile
          icon={Clock}
          label="Чтение"
          value={`~${stats.averageReadMinutes} мин`}
          hint="средняя статья"
        />
      </div>

      {editorialProgress && editorialProgress.written > 0 ? (
        <div className="mt-4 rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/80 to-white p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
              Редакционная проработка
            </p>
            <p className="text-sm font-medium tabular-nums text-emerald-900">
              {editorialProgress.written} / {editorialProgress.planTotal} ({editorialProgress.percent}%)
            </p>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-emerald-100">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${Math.max(2, editorialProgress.percent)}%` }}
            />
          </div>
          <p className="mt-2 text-xs leading-relaxed text-emerald-900/80">
            Статьи с полной ручной вычиткой помечены в каталоге. Остальные постепенно обновляются — начали с Патагонии
            {editorialProgress.byCategory.patagonia
              ? ` (${editorialProgress.byCategory.patagonia} материалов)`
              : ""}
            .
          </p>
        </div>
      ) : null}

      {topCategories.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-card sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate">
            Популярные разделы по объёму
          </p>
          <ul className="mt-3 space-y-2.5">
            {topCategories.map(({ category, count }) => (
              <li key={category}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate font-medium text-charcoal">{category}</span>
                  <span className="shrink-0 tabular-nums text-xs text-slate">{count}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky/80 to-sky"
                    style={{ width: `${Math.max(8, (count / maxCount) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof BookMarked;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-card sm:p-5">
      <div className="flex items-center gap-2 text-slate">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky/10 text-sky">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-3 font-heading text-2xl font-bold tabular-nums text-charcoal">{value}</p>
      <p className="mt-1 text-xs text-slate">{hint}</p>
    </div>
  );
}
