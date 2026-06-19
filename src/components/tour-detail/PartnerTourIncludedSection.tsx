"use client";

import ExcursionIncludedSection from "@/components/excursions/ExcursionIncludedSection";
import type { PartnerTourContent } from "@/lib/tripster/partner-tour-content";

export default function PartnerTourIncludedSection({
  content,
}: {
  content: PartnerTourContent;
}) {
  return (
    <ExcursionIncludedSection
      included={content.includedHtml}
      excluded={content.excludedHtml}
      title="Условия тура"
      includedLabel="Включено в стоимость"
      excludedLabel="Не включено"
    />
  );
}
