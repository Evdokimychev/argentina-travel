import type { Tour } from "@/types/tour";
import { resolvePackingListItems } from "@/lib/tour-public-display";
import TourSection from "./TourSection";

interface PackingListSectionProps {
  tour: Tour;
  organizerComment?: string;
}

export default function PackingListSection({ tour, organizerComment }: PackingListSectionProps) {
  const items = resolvePackingListItems(tour);
  if (items.length === 0) return null;

  return (
    <TourSection
      id="packing"
      title="Что взять с собой"
      subtitle="Рекомендации организатора"
      organizerComment={organizerComment}
    >
      <ul className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <li key={item} className="flex gap-2 text-sm text-charcoal">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
              {item}
            </li>
          ))}
      </ul>
    </TourSection>
  );
}
