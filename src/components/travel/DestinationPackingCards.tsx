import {
  DESTINATION_CARDS_UI,
  DESTINATION_PACKING_CARDS,
} from "@/data/patagonia-packing-list";
import { cn } from "@/lib/cn";

type Props = {
  className?: string;
  labels?: typeof DESTINATION_CARDS_UI;
};

/** Карточки акцентов сборов по пяти направлениям Патагонии. */
export default function DestinationPackingCards({
  className,
  labels = DESTINATION_CARDS_UI,
}: Props) {
  return (
    <section className={cn("space-y-3", className)} aria-label={labels.ariaLabel}>
      <div>
        <h3 className="font-heading text-base font-semibold text-charcoal">{labels.title}</h3>
        <p className="mt-1 text-sm text-slate">{labels.hint}</p>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" role="list">
        {DESTINATION_PACKING_CARDS.map((card) => (
          <li
            key={card.id}
            className="flex flex-col rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
          >
            <h4 className="font-heading text-sm font-bold text-charcoal">{card.title}</h4>
            <p className="mt-1 text-sm leading-relaxed text-slate">{card.summary}</p>
            <ul className="mt-3 space-y-1.5" role="list">
              {card.bullets.map((bullet) => (
                <li key={bullet} className="flex gap-2 text-sm leading-snug text-charcoal">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky" aria-hidden />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}
