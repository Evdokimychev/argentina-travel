import type { KbSource } from "@/lib/knowledge-base/types";

/** Список источников записи. */
export default function KbSources({ sources }: { sources?: KbSource[] }) {
  const publicSources = (sources ?? []).filter(
    (source) => source.url && /^https?:\/\//.test(source.url),
  );
  if (publicSources.length === 0) return null;
  return (
    <section className="mt-8 border-t border-border-subtle pt-5">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate">
        Источники
      </h2>
      <ul className="space-y-2 text-sm text-muted">
        {publicSources.map((source, idx) => {
          const label = source.title ?? source.url ?? "Источник";
          const external = source.url && /^https?:\/\//.test(source.url);
          return (
            <li key={idx} className="leading-relaxed">
              {external ? (
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-ink underline decoration-sky/40 underline-offset-2 hover:decoration-sky-ink"
                >
                  {label}
                </a>
              ) : (
                <span className="text-foreground">{label}</span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
