import { Clock, Eye, FileText, Layers } from "lucide-react";
import { formatBlogViews } from "@/lib/blog-utils";
import type { BlogIndexStats } from "@/lib/blog-utils";
import { cn } from "@/lib/cn";

type BlogStatsOverviewProps = {
  stats: BlogIndexStats;
  className?: string;
};

export default function BlogStatsOverview({ stats, className }: BlogStatsOverviewProps) {
  return (
    <div className={cn("grid gap-3 sm:grid-cols-2 xl:grid-cols-4", className)}>
      <StatTile icon={FileText} label="Статей" value={String(stats.totalPosts)} />
      <StatTile icon={Eye} label="Просмотров" value={formatBlogViews(stats.totalViews)} />
      <StatTile icon={Clock} label="Среднее чтение" value={`${stats.averageReadMinutes} мин`} />
      <div className="rounded-2xl border border-sky/15 bg-gradient-to-br from-sky/[0.06] to-white p-4 sm:p-5">
        <div className="flex items-center gap-2 text-slate">
          <Layers className="h-4 w-4 text-sky" aria-hidden />
          <span className="text-xs font-medium uppercase tracking-wider">По категориям</span>
        </div>
        <ul className="mt-3 space-y-1.5">
          {stats.categories.map(({ category, count }) => (
            <li key={category} className="flex items-center justify-between gap-2 text-sm">
              <span className="text-charcoal">{category}</span>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold tabular-nums text-sky">
                {count}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FileText;
  label: string;
  value: string;
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
    </div>
  );
}
