import Link from "next/link";

import type { KbCrumb } from "@/lib/knowledge-base/content";

/** Хлебные крошки раздела «База знаний». */
export default function KbBreadcrumbs({ items }: { items: KbCrumb[] }) {
  return (
    <nav aria-label="Хлебные крошки" className="text-sm text-muted">
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={item.href} className="flex items-center gap-1.5">
              {isLast ? (
                <span aria-current="page" className="text-foreground">
                  {item.label}
                </span>
              ) : (
                <Link href={item.href} className="hover:text-sky-ink">
                  {item.label}
                </Link>
              )}
              {!isLast && <span className="text-charcoal-15">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
