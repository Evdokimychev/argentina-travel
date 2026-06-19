function normalizePhotoPath(pathname: string): string {
  return pathname
    .replace(/\/\d+x\d+\//g, "/")
    .replace(/\/(thumbnail|medium|large|small|preview|original|scaled|thumbs2)\//gi, "/")
    .replace(/_(thumb|thumbnail|medium|large|small|preview|scaled)(?=\.[a-z0-9]+$)/i, "")
    .toLowerCase();
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
