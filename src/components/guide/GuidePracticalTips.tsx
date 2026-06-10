import HubSection from "@/components/guide/hub/HubSection";
import type { GuidePracticalTips as GuidePracticalTipsData } from "@/types/guide-pillar";

type GuidePracticalTipsProps = {
  tips: GuidePracticalTipsData;
};

const COLUMNS = [
  {
    key: "do" as const,
    title: "Стоит сделать",
    symbol: "✅",
    border: "border-emerald-200/80",
    bg: "bg-gradient-to-br from-emerald-50/80 to-white",
    titleClass: "text-emerald-800",
  },
  {
    key: "consider" as const,
    title: "Учтите",
    symbol: "⚠️",
    border: "border-amber-200/80",
    bg: "bg-gradient-to-br from-amber-50/60 to-white",
    titleClass: "text-amber-800",
  },
  {
    key: "avoid" as const,
    title: "Лучше избегать",
    symbol: "❌",
    border: "border-rose-200/80",
    bg: "bg-gradient-to-br from-rose-50/50 to-white",
    titleClass: "text-rose-800",
  },
];

export default function GuidePracticalTips({ tips }: GuidePracticalTipsProps) {
  return (
    <HubSection id="practical-tips" title="Практические советы">
      <div className="grid gap-4 lg:grid-cols-3">
        {COLUMNS.map((column) => (
          <article
            key={column.key}
            className={`rounded-2xl border p-5 ${column.border} ${column.bg}`}
          >
            <h3 className={`font-display text-base font-bold ${column.titleClass}`}>
              <span aria-hidden>{column.symbol}</span> {column.title}
            </h3>
            <ul className="mt-3 space-y-2">
              {tips[column.key].map((item) => (
                <li key={item} className="text-sm leading-relaxed text-charcoal">
                  {item}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </HubSection>
  );
}
