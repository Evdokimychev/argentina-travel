import Link from "next/link";
import { ArrowRight, BookOpen, Layers, MapPin, Route } from "lucide-react";
import type { KnowledgeLinksBundle } from "@/lib/knowledge-internal-links";

type RelatedKnowledgeSectionProps = {
  title?: string;
  links: KnowledgeLinksBundle;
  className?: string;
};

function LinkGroup({
  label,
  icon: Icon,
  items,
}: {
  label: string;
  icon: typeof MapPin;
  items: { title: string; href: string }[];
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-charcoal">
        <Icon className="h-4 w-4 text-sky" aria-hidden />
        {label}
      </h3>
      <ul className="mt-2 space-y-1.5">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="group inline-flex items-center gap-1 text-sm text-slate transition-colors hover:text-sky"
            >
              {item.title}
              <ArrowRight className="h-3 w-3 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function RelatedKnowledgeSection({
  title = "Связанные материалы",
  links,
  className,
}: RelatedKnowledgeSectionProps) {
  const hasContent =
    links.places.length +
      links.destinations.length +
      links.collections.length +
      links.itineraries.length +
      links.guides.length +
      links.blog.length >
    0;

  if (!hasContent) return null;

  return (
    <section className={className}>
      <h2 className="font-heading text-xl font-bold text-charcoal">{title}</h2>
      <p className="mt-1 text-sm text-slate">Путеводитель, подборки и маршруты для планирования поездки</p>
      <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <LinkGroup label="Места" icon={MapPin} items={links.places} />
        <LinkGroup label="Направления" icon={MapPin} items={links.destinations} />
        <LinkGroup label="Подборки" icon={Layers} items={links.collections} />
        <LinkGroup label="Маршруты" icon={Route} items={links.itineraries} />
        <LinkGroup label="Путеводитель" icon={BookOpen} items={links.guides} />
        <LinkGroup label="Блог" icon={BookOpen} items={links.blog} />
      </div>
    </section>
  );
}
