"use client";

import { useRef } from "react";
import VisualPageBuilder, {
  type VisualPageBuilderSection,
} from "@/components/admin/page-builder/VisualPageBuilder";
import type { PageBuilderPatternSlug } from "@/lib/cms/page-builder/pattern-registry";
import type { BlogPostSection } from "@/types";

type Props = {
  sections: BlogPostSection[];
  onChange: (sections: BlogPostSection[]) => void;
  title?: string;
  starterPatterns?: PageBuilderPatternSlug[];
};

function toVisual(
  sections: BlogPostSection[],
  idMap: Map<string, string>,
): VisualPageBuilderSection[] {
  return sections.map((section, index) => {
    const key = `${index}:${section.title}`;
    const existing = idMap.get(key);
    const id = existing ?? crypto.randomUUID();
    idMap.set(key, id);
    return {
      id,
      title: section.title,
      blockType: section.blockType,
      blocks: section.blocks,
      legacyBody: section.body,
    };
  });
}

function fromVisual(sections: VisualPageBuilderSection[]): BlogPostSection[] {
  return sections.map((section) => ({
    title: section.title,
    body: section.legacyBody ?? "",
    blockType: section.blockType,
    blocks: section.blocks,
  }));
}

export default function BlogSectionPageBuilder({
  sections,
  onChange,
  title,
  starterPatterns = ["practical-guide", "expert-story", "destination-story"],
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
      legacyBodyLabel="Legacy: текстовое тело (markdown)"
      starterPatterns={starterPatterns}
    />
  );
}
