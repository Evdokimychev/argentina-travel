import { getKbEditorialReview } from "@/lib/knowledge-base/editorial";
import type { KbEntry } from "@/lib/knowledge-base/types";

export default function KbEditorialNotice({ entry }: { entry: KbEntry }) {
  const review = getKbEditorialReview(entry);

  if (!review.isSensitive && !review.needsAttention) return null;

  const toneClass = review.needsAttention
    ? "border-warning/30 bg-warning-muted/60 text-warning"
    : "border-sky/20 bg-sky/5 text-sky-ink";

  return (
    <aside className={`mt-5 rounded-panel border p-4 ${toneClass}`}>
      <p className="text-sm font-semibold">
        {review.isSensitive ? "Актуальность важна" : "Редакционная проверка"}
      </p>
      <p className="mt-1 text-sm leading-relaxed">
        {review.isSensitive
          ? "Это справочный материал: он не заменяет индивидуальную юридическую, финансовую, медицинскую консультацию или инструктаж по безопасности. Правила, цены и ситуация на месте могут меняться: перед важным решением сверяйтесь с официальными источниками или профильным специалистом."
          : "Материал полезен как ориентир, но отдельные детали стоит перепроверить перед поездкой или переездом."}
      </p>
      <div className="mt-3 flex flex-wrap gap-2 text-2xs font-medium">
        {entry.last_verified && (
          <span className="rounded-full bg-white/70 px-2.5 py-1 text-current">
            Проверено: {entry.last_verified}
          </span>
        )}
        {review.reviewDueAt && (
          <span className="rounded-full bg-white/70 px-2.5 py-1 text-current">
            Плановая перепроверка: {review.reviewDueAt}
          </span>
        )}
        {review.sourceCount > 0 ? (
          <span className="rounded-full bg-white/70 px-2.5 py-1 text-current">
            Источников: {review.sourceCount}
          </span>
        ) : (
          <span className="rounded-full bg-white/70 px-2.5 py-1 text-current">
            Источники уточняются
          </span>
        )}
      </div>
    </aside>
  );
}
