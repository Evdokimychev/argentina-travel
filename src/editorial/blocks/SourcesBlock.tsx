import { cn } from "@/lib/cn";
import type { BlogEditorialDensity, BlogSourceItem } from "@/types/blog-content-blocks";

const GROUP_LABELS: Record<string, string> = {
  official: "Официальные источники",
  legal: "Нормативные документы",
  "primary-data": "Первичные данные",
  "ru-context": "Русскоязычный контекст",
  personal: "Личный опыт",
  updates: "Обновления",
};

type Props = {
  title?: string;
  variant?: "compact" | "grouped" | "expandable";
  items: BlogSourceItem[];
  density?: BlogEditorialDensity;
};

export default function SourcesBlock({
  title = "Источники и дата проверки",
  variant = "grouped",
  items,
  density = "comfortable",
}: Props) {
  const filtered = items.filter((item) => item.title.trim() && item.url.trim());
  if (filtered.length === 0) return null;

  const groups = new Map<string, BlogSourceItem[]>();
  for (const item of filtered) {
    const key = item.type ?? "official";
    const list = groups.get(key) ?? [];
    list.push(item);
    groups.set(key, list);
  }

  return (
    <section
      className={cn(
        "not-prose rounded-2xl border border-gray-100 bg-white dark:border-white/10 dark:bg-surface-elevated",
        density === "compact" ? "p-3" : "p-4 sm:p-5",
      )}
      data-editorial-block="sources"
      data-variant={variant}
      aria-label={title}
    >
      <h3 className="font-heading text-base font-semibold text-charcoal">{title}</h3>

      {variant === "grouped" ? (
        <div className="mt-3 space-y-4">
          {[...groups.entries()].map(([group, groupItems]) => (
            <div key={group}>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate dark:text-muted">
                {GROUP_LABELS[group] ?? group}
              </p>
              <ul className="mt-2 space-y-2">
                {groupItems.map((item) => (
                  <SourceItem key={`${item.url}-${item.title}`} item={item} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <ul className="mt-3 space-y-2">
          {filtered.map((item) => (
            <SourceItem key={`${item.url}-${item.title}`} item={item} />
          ))}
        </ul>
      )}
    </section>
  );
}

function SourceItem({ item }: { item: BlogSourceItem }) {
  return (
    <li className="text-sm leading-relaxed">
      <a
        href={item.url}
        className="font-medium text-sky-ink underline-offset-2 hover:underline dark:text-sky"
        rel="noopener noreferrer"
        target="_blank"
      >
        {item.title}
      </a>
      {item.publisher ? (
        <span className="text-slate dark:text-muted"> — {item.publisher}</span>
      ) : null}
      {item.accessedAt ? (
        <span className="block text-xs text-slate dark:text-muted">
          Проверено: {item.accessedAt}
        </span>
      ) : null}
      {item.notes ? (
        <span className="block text-xs text-slate dark:text-muted">{item.notes}</span>
      ) : null}
    </li>
  );
}
