function normalizePathname(pathname: string): string {
  return pathname.replace(/\/+/g, "/").toLowerCase();
}

function normalizePhotoPath(pathname: string): string {
  return normalizePathname(pathname)
    .replace(/\/\d+x\d+\//g, "/")
    .replace(/\/(thumbnail|medium|large|small|preview|original|scaled|thumbs2|resize_cache)\//gi, "/")
    .replace(/_(thumb|thumbnail|medium|large|small|preview|scaled)(?=\.[a-z0-9]+$)/i, "");
}

function youtravelFileIdentityKey(pathname: string): string | null {
  const normalized = normalizePathname(pathname);
  const match = normalized.match(/\/([a-z0-9]{16,})\.[a-z0-9]+$/i);
  if (match?.[1]) return `youtravel:${match[1]}`;
  return null;
}

export function galleryImageIdentityKey(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";

  const embeddedCdn = trimmed.match(/cdn\.tripster\.ru(\/[^?\s"')]+)/i);
  if (embeddedCdn?.[1]) {
    return normalizePhotoPath(embeddedCdn[1]);
  }

  try {
    const parsed = new URL(trimmed);

    if (parsed.hostname.includes("resize.tripster.ru")) {
      const hash = parsed.pathname.split("/").filter(Boolean)[0];
      if (hash) return `tripster-resize:${hash.toLowerCase()}`;
    }

    if (parsed.hostname.includes("youtravel.me")) {
      const youtravelKey = youtravelFileIdentityKey(parsed.pathname);
      if (youtravelKey) return youtravelKey;
    }

    return normalizePhotoPath(parsed.pathname);
  } catch {
    return trimmed.toLowerCase();
  }
}

export function dedupeGalleryImages(urls: string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const url of urls) {
    const trimmed = url?.trim();
    if (!trimmed) continue;
    const key = galleryImageIdentityKey(trimmed);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(trimmed);
  }

  return unique;
}
