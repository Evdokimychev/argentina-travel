"use client";

import VisualPageBuilder, {
  type VisualPageBuilderSection,
} from "@/components/admin/page-builder/VisualPageBuilder";
import type { ContentSection } from "@/types/content-page";

type Props = {
  sections: ContentSection[];
  onChange: (sections: ContentSection[]) => void;
};

function toVisual(sections: ContentSection[]): VisualPageBuilderSection[] {
  return sections.map((section, index) => ({
    id: `guide-section-${index}`,
    title: section.heading ?? "",
    blockType: section.blockType,
    blocks: section.blocks,
    legacyBody: section.html ?? section.paragraphs?.join("\n\n") ?? "",
  }));
}

function fromVisual(sections: VisualPageBuilderSection[]): ContentSection[] {
  return sections.map((section) => ({
    heading: section.title,
    blockType: section.blockType,
    blocks: section.blocks,
    html: section.legacyBody?.trim() || undefined,
  }));
}

export default function GuideSectionPageBuilder({ sections, onChange }: Props) {
  return (
    <VisualPageBuilder
      sections={toVisual(sections)}
      onChange={(next) => onChange(fromVisual(next))}
      title="Конструктор путеводителя"
      showLegacyBody
      legacyBodyLabel="Legacy: HTML / абзацы"
    />
  );
}
