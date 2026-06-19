import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { RelatedContentItem, RelatedContentKind } from "@/types/content-reading";

type RelatedContentCardsProps = {
  title?: string;
  items: RelatedContentItem[];
  className?: string;
};

const kindLabels: Record<RelatedContentKind, string> = {
  guide: "Путеводитель",
  blog: "Блог",
  destination: "Направление",
  place: "Место",
  collection: "Подборка",
  itinerary: "Маршрут",
  tour: "Тур",
  link: "Материал",
};

export default function RelatedContentCards({
  title = "Смотрите также",
  items,
  className,
}: RelatedContentCardsProps) {
  if (items.length === 0) return null;

  return (
    <section className={className}>
      <h2 className="font-heading text-xl font-bold text-charcoal">{title}</h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="group flex h-full flex-col rounded-2xl border border-gray-100 bg-surface-muted/40 px-4 py-3 transition-colors hover:border-sky/25 hover:bg-sky/5"
            >
              <span className="text-[10px] font-semibold uppercase tracking-wider text-sky">
                {kindLabels[item.kind ?? "link"]}
              </span>
              <span className="mt-1 block flex-1 text-sm font-medium leading-snug text-charcoal group-hover:text-sky">
                {item.title}
              </span>
              {item.description ? (
                <span className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate">
                  {item.description}
                </span>
              ) : null}
              <ArrowRight
                className="mt-2 h-4 w-4 text-sky opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100"
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
