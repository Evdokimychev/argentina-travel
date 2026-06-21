import type { BlogSeasonItem } from "@/types/blog-content-blocks";

type BlogSeasonWidgetProps = {
  items: BlogSeasonItem[];
  conclusion?: string;
};

function SeasonCard({ season }: { season: BlogSeasonItem }) {
  return (
    <article className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
      <h3 className="font-heading text-base font-bold text-charcoal">{season.name}</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Плюсы</p>
          <ul className="mt-1.5 space-y-1 text-sm text-slate">
            {season.pros.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-emerald-600" aria-hidden>+</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Минусы</p>
          <ul className="mt-1.5 space-y-1 text-sm text-slate">
            {season.cons.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-amber-700" aria-hidden>−</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}

export default function BlogSeasonWidget({ items, conclusion }: BlogSeasonWidgetProps) {
  return (
    <div className="space-y-4">
      {items.map((season) => (
        <SeasonCard key={season.name} season={season} />
      ))}
      {conclusion ? (
        <p className="rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm leading-relaxed text-slate shadow-sm sm:px-5">
          {conclusion}
        </p>
      ) : null}
    </div>
  );
}
