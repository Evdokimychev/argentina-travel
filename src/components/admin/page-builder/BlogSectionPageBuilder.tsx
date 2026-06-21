"use client";

import VisualPageBuilder, {
  type VisualPageBuilderSection,
} from "@/components/admin/page-builder/VisualPageBuilder";
import type { BlogPostSection } from "@/types";

type Props = {
  sections: BlogPostSection[];
  onChange: (sections: BlogPostSection[]) => void;
};

function toVisual(sections: BlogPostSection[]): VisualPageBuilderSection[] {
  return sections.map((section, index) => ({
    id: `blog-section-${index}`,
    title: section.title,
    blockType: section.blockType,
    blocks: section.blocks,
    legacyBody: section.body,
  }));
}

function fromVisual(sections: VisualPageBuilderSection[]): BlogPostSection[] {
  return sections.map((section) => ({
    title: section.title,
    body: section.legacyBody ?? "",
    blockType: section.blockType,
    blocks: section.blocks,
  }));
}

export default function BlogSectionPageBuilder({ sections, onChange }: Props) {
  return (
    <VisualPageBuilder
      sections={toVisual(sections)}
      onChange={(next) => onChange(fromVisual(next))}
      showLegacyBody
      legacyBodyLabel="Legacy: текстовое тело (markdown)"
    />
  );
}
