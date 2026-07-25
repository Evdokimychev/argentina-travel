import Link from "next/link";
import { cn } from "@/lib/cn";
import type { BlogEditorialDensity } from "@/types/blog-content-blocks";

type Item = { label: string; href: string; description?: string };

type Props = {
  title?: string;
  items: Item[];
  density?: BlogEditorialDensity;
};

export default function HubCtaRowBlock({
  title,
  items,
  density = "comfortable",
}: Props) {
  const filtered = items.filter((item) => item.label.trim() && item.href.trim());
  if (filtered.length === 0) return null;

  return (
    <section
      className="not-prose space-y-3"
      data-editorial-block="hub-cta-row"
      aria-label={title ?? "Быстрые действия"}
    >
      {title ? (
        <h3 className="font-heading text-base font-semibold text-charcoal">{title}</h3>
      ) : null}
      <div
        className={cn(
          "grid gap-3",
          filtered.length === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        )}
      >
        {filtered.map((item) => (
          <Link
            key={`${item.href}-${item.label}`}
            href={item.href}
            className={cn(
              "rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:border-sky/30 hover:shadow-md dark:border-white/10 dark:bg-surface-elevated",
              density === "compact" ? "p-3" : "p-4",
            )}
          >
            <span className="block text-sm font-semibold text-charcoal">{item.label}</span>
            {item.description ? (
              <span className="mt-1 block text-xs leading-relaxed text-slate dark:text-muted">
                {item.description}
              </span>
            ) : null}
          </Link>
        ))}
      </div>
    </section>
  );
}
