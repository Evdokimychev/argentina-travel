const RESERVED_SEGMENTS = new Set(["city", "guide", "region"]);
const RESERVED_PREFIXES = ["error-", "page-"];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeSerializedHtml(html) {
  return String(html ?? "")
    .replaceAll("\\/", "/")
    .replaceAll("\\u002F", "/")
    .replaceAll("\\u002f", "/")
    .replaceAll("\\u0022", '"')
    .replaceAll('\\"', '"');
}

function isReservedSegment(segment) {
  const normalized = segment.toLowerCase();
  return (
    RESERVED_SEGMENTS.has(normalized) ||
    RESERVED_PREFIXES.some((prefix) => normalized.startsWith(prefix))
  );
}

export function findCommercialDetailPath(html, catalogPath) {
  const normalizedCatalog = `/${catalogPath.replace(/^\/+|\/+$/g, "")}`;
  const pathPattern = `${escapeRegExp(normalizedCatalog)}\\/[a-z0-9][a-z0-9-]*`;
  const normalizedHtml = normalizeSerializedHtml(html);
  const patterns = [
    new RegExp(`\\bhref\\s*=\\s*["'](${pathPattern})(?:[?#][^"']*)?["']`, "gi"),
    new RegExp(`["']href["']\\s*:\\s*["'](${pathPattern})(?:[?#][^"']*)?["']`, "gi"),
  ];

  for (const pattern of patterns) {
    for (const match of normalizedHtml.matchAll(pattern)) {
      const pathname = match[1];
      const segments = pathname.split("/").filter(Boolean);
      if (segments.length !== 2) continue;
      if (isReservedSegment(segments[1])) continue;
      return pathname;
    }
  }

  return null;
}
