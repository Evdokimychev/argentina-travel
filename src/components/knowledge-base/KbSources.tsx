import type { KbSource } from "@/lib/knowledge-base/types";

/** Список источников записи. */
export default function KbSources({ sources }: { sources?: KbSource[] }) {
  if (!sources || sources.length === 0) return null;
  return (
    <section className="mt-8 border-t border-border-subtle pt-5">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate">
        Источники
      </h2>
      <ul className="space-y-2 text-sm text-muted">
        {sources.map((source, idx) => {
          const label = source.title ?? source.url ?? "Источник";
          const external = source.url && /^https?:\/\//.test(source.url);
          return (
            <li
              key={`${source.url ?? source.title ?? "source"}-${idx}`}
              id={`kb-source-${idx + 1}`}
              className="scroll-mt-24 leading-relaxed"
            >
              <span className="mr-1.5 text-xs font-semibold text-slate" aria-hidden="true">
                {idx + 1}.
              </span>
              {external ? (
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-8 items-center text-sky-ink underline decoration-sky/40 underline-offset-2 hover:decoration-sky-ink focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky"
                >
                  {label}
                </a>
              ) : (
                <span className="text-foreground">{label}</span>
              )}
              {source.note && <span className="text-slate"> — {source.note}</span>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
