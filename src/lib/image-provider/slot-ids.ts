/** Maps pageId + slotId to manifest asset id (matches stock-media-entities.mjs). */
export function resolveSlotAssetId(pageId: string, slotId: string): string {
  if (pageId === "service:home") {
    return `home-${slotId}`;
  }

  if (pageId.startsWith("guide:")) {
    const slug = pageId.slice(6);
    return `guide-${slug}-${slotId}`;
  }

  if (pageId.startsWith("immigration:")) {
    const slug = pageId.slice(12);
    if (slug === "hub") return `immigration-hub-${slotId}`;
    return `immigration-${slug}-${slotId}`;
  }

  if (pageId.startsWith("rich:")) {
    return `blog-rich-${pageId.slice(5)}-${slotId}`;
  }

  if (pageId.startsWith("blog:")) {
    return `blog-${pageId.slice(5)}-${slotId}`;
  }

  if (pageId.startsWith("destination:")) {
    return `destination-${pageId.slice(12)}-${slotId}`;
  }

  if (pageId.startsWith("service:")) {
    return `service-${slotId}`;
  }

  return `${pageId.replace(/:/g, "-")}-${slotId}`;
}
