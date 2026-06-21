import type { BlogBudgetItem } from "@/types/blog-content-blocks";

type BlogBudgetWidgetProps = {
  items: BlogBudgetItem[];
  note?: string;
};

export default function BlogBudgetWidget({ items, note }: BlogBudgetWidgetProps) {
  return (
    <div className="space-y-3">
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-sky/[0.03] p-4 shadow-sm"
          >
            <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate/80">
              {item.label}
            </dt>
            <dd className="mt-1.5 text-sm font-medium leading-snug text-charcoal">{item.value}</dd>
          </div>
        ))}
      </dl>
      {note ? (
        <p className="text-xs leading-relaxed text-slate">{note}</p>
      ) : null}
    </div>
  );
}
