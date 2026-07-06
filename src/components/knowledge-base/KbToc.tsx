/** Оглавление статьи (якорные ссылки на H2). */
export default function KbToc({
  headings,
}: {
  headings: { id: string; text: string }[];
}) {
  if (headings.length < 3) return null;
  return (
    <nav aria-label="Содержание статьи" className="text-sm">
      <p className="mb-2 text-2xs font-semibold uppercase tracking-wide text-slate">
        Содержание
      </p>
      <ul className="space-y-1.5 border-l border-border-subtle">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              className="-ml-px block border-l-2 border-transparent pl-3 text-muted hover:border-sky hover:text-sky-ink"
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
