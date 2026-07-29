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

export async function requestSmokeDocument({
  baseUrl,
  pathname,
  stage,
  timeoutMs = 15_000,
  fetchImpl = fetch,
  now = Date.now,
}) {
  const startedAt = now();
  try {
    const response = await fetchImpl(`${baseUrl}${pathname}`, {
      method: "GET",
      signal: AbortSignal.timeout(Number.isFinite(timeoutMs) ? timeoutMs : 15_000),
    });
    const text = await response.text();
    return {
      status: response.status,
      text,
      contentType: response.headers.get("content-type") ?? "",
      durationMs: Math.max(0, now() - startedAt),
    };
  } catch (error) {
    const durationMs = Math.max(0, now() - startedAt);
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Smoke request failed: stage=${stage} path=${pathname} durationMs=${durationMs} timeoutMs=${timeoutMs}: ${reason}`,
      { cause: error },
    );
  }
}

export async function verifyCommercialCatalogFromHtml({
  catalogPath,
  catalogHtml,
  fetchDetail,
}) {
  const detailPath = findCommercialDetailPath(catalogHtml, catalogPath);
  if (!detailPath) {
    throw new Error(
      `${catalogPath}: no commercial detail link found; catalog may be empty or unavailable`,
    );
  }

  const detail = await fetchDetail(detailPath);
  if (detail.status !== 200) {
    throw new Error(`GET ${detailPath} returned ${detail.status}`);
  }
  if (
    !detail.contentType.includes("text/html") ||
    !detail.text.toLowerCase().includes("<html")
  ) {
    throw new Error(`GET ${detailPath} did not return an HTML document`);
  }
  return detailPath;
}
