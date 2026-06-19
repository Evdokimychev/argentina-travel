/** Stable ASCII id for pillar section anchors from Russian headings. */
export function pillarSectionId(slug: string, index: number, title: string): string {
  const normalized = title
    .toLowerCase()
    .replace(/[^a-z0-9а-яё\s-]/gi, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 48);
  return normalized || `${slug}-section-${index + 1}`;
}
