const RESERVED_SEGMENTS = new Set(["city", "region"]);

export function findCommercialDetailPath(html, catalogPath) {
  const normalizedCatalog = `/${catalogPath.replace(/^\/+|\/+$/g, "")}`;
  const pattern = new RegExp(`${normalizedCatalog.replace("/", "\\/")}\\/[a-z0-9][a-z0-9-]*`, "gi");
  const normalizedHtml = String(html ?? "")
    .replaceAll("\\/", "/")
    .replaceAll("\\u002F", "/")
    .replaceAll("\\u002f", "/");

  for (const match of normalizedHtml.matchAll(pattern)) {
    const pathname = match[0];
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length !== 2) continue;
    if (RESERVED_SEGMENTS.has(segments[1].toLowerCase())) continue;
    return pathname;
  }

  return null;
}
