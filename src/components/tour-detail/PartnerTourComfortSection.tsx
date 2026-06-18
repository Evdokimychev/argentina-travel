"use client";

import TourSection from "./TourSection";
import type { PartnerTourContent } from "@/lib/tripster/partner-tour-content";

export default function PartnerTourComfortSection({
  content,
}: {
  content: PartnerTourContent;
}) {
  if (!content.comfortHtml?.trim()) return null;

  return (
    <TourSection id="comfort" title="Комфорт и условия">
      <div
        className="rich-text-editor-content space-y-4 leading-relaxed text-charcoal/90"
        dangerouslySetInnerHTML={{ __html: content.comfortHtml }}
      />
    </TourSection>
  );
}
