import TourSection from "./TourSection";

export function ImportantSection({
  items,
  organizerComment,
}: {
  items: string[];
  organizerComment?: string;
}) {
  const visibleItems = items.filter((item) => item.trim());
  if (!visibleItems.length) return null;

  return (
    <TourSection id="important" title="Важно знать" organizerComment={organizerComment}>
      <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-6">
        <ul className="space-y-3">
          {visibleItems.map((item) => (
            <li key={item} className="flex gap-3 text-sm text-charcoal">
              <span className="text-amber-500">⚠</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </TourSection>
  );
}
