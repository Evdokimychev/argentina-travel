import Link from "next/link";
import { cn } from "@/lib/cn";
import type { BlogEditorialDensity } from "@/types/blog-content-blocks";

type Item = { label: string; href: string; description?: string };

type Props = {
  title?: string;
  items: Item[];
  density?: BlogEditorialDensity;
};

export default function RelatedLinksBlock({
  title = "Читайте также",
  items,
  density = "comfortable",
}: Props) {
  const filtered = items.filter((item) => item.label.trim() && item.href.trim());
  if (filtered.length === 0) return null;

  return (
    <nav
      className={cn(
        "not-prose rounded-2xl border border-gray-100 bg-white dark:border-white/10 dark:bg-surface-elevated",
        density === "compact" ? "p-3" : "p-4 sm:p-5",
      )}
      aria-label={title}
      data-editorial-block="related-links"
    >
      <h3 className="font-heading text-base font-semibold text-charcoal">{title}</h3>
      <ul className="mt-3 space-y-2">
        {filtered.map((item) => (
          <li key={`${item.href}-${item.label}`}>
            <Link
              href={item.href}
              className="group flex min-h-11 flex-col justify-center rounded-xl border border-transparent px-3 py-2 transition hover:border-sky/25 hover:bg-sky/[0.04]"
            >
              <span className="text-sm font-medium text-sky-ink group-hover:underline dark:text-sky">
                {item.label}
              </span>
              {item.description ? (
                <span className="mt-0.5 text-xs text-slate dark:text-muted">{item.description}</span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
