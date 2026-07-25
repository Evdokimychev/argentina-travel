"use client";

import { useRef } from "react";
import VisualPageBuilder, {
  type VisualPageBuilderSection,
} from "@/components/admin/page-builder/VisualPageBuilder";
import type { ContentSection } from "@/types/content-page";
import type { PageBuilderPatternSlug } from "@/lib/cms/page-builder/pattern-registry";
import type { PageBuilderPageTemplateSlug } from "@/lib/cms/page-builder/page-template-registry";

type Props = {
  sections: ContentSection[];
  onChange: (sections: ContentSection[]) => void;
  title?: string;
  starterPatterns?: PageBuilderPatternSlug[];
  starterPageTemplates?: PageBuilderPageTemplateSlug[];
  helpText?: string;
};

function toVisual(
  sections: ContentSection[],
  idMap: Map<string, string>,
): VisualPageBuilderSection[] {
  return sections.map((section, index) => {
    const heading = section.heading ?? "";
    const key = `${index}:${heading}`;
    const existing = idMap.get(key);
    const id = existing ?? crypto.randomUUID();
    idMap.set(key, id);
    return {
      id,
      title: heading,
      blockType: section.blockType,
      blocks: section.blocks,
      legacyBody: section.html ?? section.paragraphs?.join("\n\n") ?? "",
    };
  });
}

function fromVisual(sections: VisualPageBuilderSection[]): ContentSection[] {
  return sections.map((section) => ({
    heading: section.title,
    blockType: section.blockType,
    blocks: section.blocks,
    html: section.legacyBody?.trim() ? section.legacyBody : undefined,
    paragraphs: section.legacyBody?.trim()
      ? section.legacyBody
          .split(/\n\n+/)
          .map((part) => part.trim())
          .filter(Boolean)
      : undefined,
  }));
}

export default function GuideSectionPageBuilder({
  sections,
  onChange,
  title = "Визуальный конструктор",
  starterPatterns = ["practical-guide", "destination-page-body", "hub-intro"],
  starterPageTemplates = [],
  helpText,
}: Props) {
  const idMapRef = useRef(new Map<string, string>());

  return (
    <VisualPageBuilder
      title={title}
      sections={toVisual(sections, idMapRef.current)}
      onChange={(next) => {
        idMapRef.current = new Map(
          next.map((section, index) => [`${index}:${section.title}`, section.id]),
        );
        onChange(fromVisual(next));
      }}
      showLegacyBody
      legacyBodyLabel="Legacy: HTML / абзацы раздела"
      starterPatterns={starterPatterns}
      starterPageTemplates={starterPageTemplates}
      helpText={helpText}
    />
  );
}
