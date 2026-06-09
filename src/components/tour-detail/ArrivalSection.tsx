import { SectionHeading } from "./InfoModal";

export function ImportantSection({ items }: { items: string[] }) {
  return (
    <section id="important" className="tour-section-target">
      <SectionHeading title="Важно знать" />
      <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-6">
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item} className="flex gap-3 text-sm text-charcoal">
              <span className="text-amber-500">⚠</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
