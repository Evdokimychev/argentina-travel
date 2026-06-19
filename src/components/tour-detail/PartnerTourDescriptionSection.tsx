"use client";

import ExcursionContentBlocks from "@/components/excursions/ExcursionContentBlocks";
import {
  isPartnerOrgDetailsBlockTitle,
  type PartnerTourContent,
} from "@/lib/tripster/partner-tour-content";

export default function PartnerTourDescriptionSection({
  content,
}: {
  content: PartnerTourContent;
}) {
  const blocks = content.blocks.filter(
    (block) => !isPartnerOrgDetailsBlockTitle(block.title)
  );

  if (!blocks.length && !content.introHtml) return null;

  return (
    <div className="space-y-8">
      {content.introHtml ? (
        <div
          className="rich-text-editor-content leading-relaxed text-charcoal/90"
          dangerouslySetInnerHTML={{ __html: content.introHtml }}
        />
      ) : null}
      {blocks.length ? (
        <ExcursionContentBlocks
          blocks={blocks}
          summaryTitle=""
          descriptionTitle=""
        />
      ) : null}
    </div>
  );
}
