import type { ContentHeadingSource, ContentTocItem } from "@/types/content-reading";

/** Stable slug for in-page anchors from a heading label. */
export function headingToAnchorId(text: string, used: Set<string>): string {
  const base =
    text
      .toLowerCase()
      .trim()
      .replace(/[^\p{L}\p{N}\s-]/gu, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "section";

  let id = base;
  let suffix = 2;
  while (used.has(id)) {
    id = `${base}-${suffix++}`;
  }
  used.add(id);
  return id;
}

export function buildTocItemsFromHeadings(sources: ContentHeadingSource[]): ContentTocItem[] {
  const used = new Set<string>();
  const items: ContentTocItem[] = [];

  for (const source of sources) {
    const level = source.level ?? 2;
    items.push({
      id: headingToAnchorId(source.heading, used),
      label: source.heading,
      level,
    });

    for (const subheading of source.subheadings ?? []) {
      items.push({
        id: headingToAnchorId(subheading, used),
        label: subheading,
        level: 3,
      });
    }
  }

  return items;
}

export function assignHeadingIds(
  headings: string[],
): { items: ContentTocItem[]; ids: string[] } {
  const used = new Set<string>();
  const items: ContentTocItem[] = [];
  const ids: string[] = [];

  for (const heading of headings) {
    const id = headingToAnchorId(heading, used);
    ids.push(id);
    items.push({ id, label: heading, level: 2 });
  }

  return { items, ids };
}
