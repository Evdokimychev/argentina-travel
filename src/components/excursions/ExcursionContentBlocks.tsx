"use client";

import TourSection from "@/components/tour-detail/TourSection";
import type { ExcursionDescriptionBlock } from "@/types/excursion";

export default function ExcursionContentBlocks({
  blocks,
  annotation,
  description,
  summaryTitle,
  descriptionTitle,
}: {
  blocks: ExcursionDescriptionBlock[];
  annotation?: string;
  description?: string;
  summaryTitle: string;
  descriptionTitle: string;
}) {
  if (blocks.length > 0) {
    return (
      <div className="space-y-10">
        {blocks.map((block) => (
          <TourSection key={`${block.title}-${block.html.slice(0, 32)}`} id={`block-${block.title}`} title={block.title}>
            <div
              className="rich-text-editor-content space-y-4 leading-relaxed text-charcoal/90"
              dangerouslySetInnerHTML={{ __html: block.html }}
            />
          </TourSection>
        ))}
      </div>
    );
  }

  return (
    <>
      {annotation ? (
        <TourSection id="program" title={summaryTitle}>
          <p className="leading-relaxed text-charcoal/90">{annotation}</p>
        </TourSection>
      ) : null}
      {description ? (
        <TourSection id="description" title={descriptionTitle}>
          <div className="space-y-4 leading-relaxed text-charcoal/90">
            {description.split("\n").map((paragraph) => (
              <p key={paragraph.slice(0, 40)}>{paragraph}</p>
            ))}
          </div>
        </TourSection>
      ) : null}
    </>
  );
}
