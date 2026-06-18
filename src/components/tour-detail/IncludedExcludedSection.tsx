import { hasTermsListContent } from "@/lib/tour-public-display";
import TourSection from "./TourSection";
import TourTermsAccordion from "./TourTermsAccordion";

export default function IncludedExcludedSection({
  included,
  excluded,
}: {
  included: string[];
  excluded: string[];
}) {
  const includedItems = included.filter((item) => item.trim());
  const excludedItems = excluded.filter((item) => item.trim());

  if (!hasTermsListContent(includedItems) && !hasTermsListContent(excludedItems)) {
    return null;
  }

  return (
    <TourSection id="included" title="Условия тура" subtitle="Что включено и не включено в стоимость">
      <div className="grid gap-4 sm:grid-cols-2">
        {hasTermsListContent(includedItems) ? (
          <TourTermsAccordion title="Что включено" items={includedItems} variant="included" />
        ) : null}
        {hasTermsListContent(excludedItems) ? (
          <TourTermsAccordion title="Что не включено" items={excludedItems} variant="excluded" />
        ) : null}
      </div>
    </TourSection>
  );
}
