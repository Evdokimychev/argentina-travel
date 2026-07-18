import { cn } from "@/lib/cn";
import type { BlogFactItem } from "@/types/blog-content-blocks";

type Props = {
  title?: string;
  items: BlogFactItem[];
  columns?: 2 | 3 | 4;
};

export default function BlogFactsGridBlock({ title, items, columns = 3 }: Props) {
  const visibleItems = items.filter(
    (item) => item.label.trim() || item.value.trim() || item.description?.trim()
  );
  if (visibleItems.length === 0) return null;

  return (
    <section className="rounded-[1.75rem] border border-sky/15 bg-sky/[0.045] p-4 sm:p-6">
      {title ? (
        <h3 className="mb-4 font-display text-xl font-semibold tracking-[-0.015em] text-charcoal sm:text-2xl">
          {title}
        </h3>
      ) : null}
      <dl
        className={cn(
          "grid gap-3",
          columns === 2 && "sm:grid-cols-2",
          columns === 3 && "sm:grid-cols-2 lg:grid-cols-3",
          columns === 4 && "sm:grid-cols-2 lg:grid-cols-4"
        )}
      >
        {visibleItems.map((item, index) => (
          <div
            key={`${item.label}-${item.value}-${index}`}
            className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-[0_8px_26px_-22px_rgba(15,23,42,0.55)]"
          >
            {item.label ? (
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-sky-dark">
                {item.label}
              </dt>
            ) : null}
            {item.value ? (
              <dd className="mt-2 font-display text-xl font-semibold leading-tight text-charcoal">
                {item.value}
              </dd>
            ) : null}
            {item.description ? (
              <dd className="mt-2 text-xs leading-5 text-slate">{item.description}</dd>
            ) : null}
          </div>
        ))}
      </dl>
    </section>
  );
}
