/**
 * Server/script-only Unsplash client. Do not import from client components.
 */
import type { ImageAttribution } from "./types";
import { ROLE_WIDTHS } from "./sizes";

const USER_AGENT = "argentina-travel-image-provider/1.0 (https://www.goargentina.ru)";

export interface UnsplashSearchResult {
  id: string;
  downloadUrl: string;
  sourceUrl: string;
  authorName: string;
  authorProfileUrl?: string;
  license: string;
  title?: string;
  description?: string;
}

function getKey(): string {
  return process.env.UNSPLASH_ACCESS_KEY ?? "";
}

function unsplashDownloadUrl(photoId: string, width: number): string {
  return `https://images.unsplash.com/photo-${photoId}?w=${width}&q=85&fit=crop&auto=format&fm=jpg`;
}

export async function searchUnsplash(
  query: string,
  width: number = ROLE_WIDTHS.hero,
): Promise<UnsplashSearchResult[]> {
  const key = getKey();
  if (!key) return [];

  const params = new URLSearchParams({
    query,
    orientation: "landscape",
    content_filter: "high",
    per_page: "8",
  });

  const res = await fetch(`https://api.unsplash.com/search/photos?${params}`, {
    headers: {
      Authorization: `Client-ID ${key}`,
      "Accept-Version": "v1",
      "User-Agent": USER_AGENT,
    },
  });

  if (res.status === 401) {
    console.warn(
      "Unsplash HTTP 401 — проверьте UNSPLASH_ACCESS_KEY в .env.local (заголовок Authorization: Client-ID …)",
    );
    return [];
  }
  if (!res.ok) throw new Error(`Unsplash HTTP ${res.status}`);

  const data = (await res.json()) as {
    results?: Array<{
      id: string;
      urls?: { raw?: string; regular?: string };
      links?: { html?: string };
      user?: { name?: string; links?: { html?: string } };
      description?: string;
      alt_description?: string;
    }>;
  };

  return (data.results ?? []).map((p) => ({
    id: p.id,
    downloadUrl: p.urls?.raw
      ? `${p.urls.raw}&w=${width}&q=85&fit=crop&auto=format&fm=jpg`
      : (p.urls?.regular ?? unsplashDownloadUrl(p.id, width)),
    sourceUrl: p.links?.html ?? `https://unsplash.com/photos/${p.id}`,
    authorName: p.user?.name ?? "Unsplash",
    authorProfileUrl: p.user?.links?.html,
    license: "Unsplash License",
    title: p.alt_description ?? undefined,
    description: p.description ?? undefined,
  }));
}

export async function downloadUnsplashFallback(
  photoId: string,
  width: number,
): Promise<UnsplashSearchResult> {
  const url = unsplashDownloadUrl(photoId, width);
  const res = await fetch(url, { method: "HEAD", headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`Unsplash fallback HTTP ${res.status}`);
  return {
    id: photoId,
    downloadUrl: url,
    sourceUrl: `https://unsplash.com/photos/${photoId}`,
    authorName: "Unsplash",
    license: "Unsplash License",
  };
}

export function toUnsplashAttribution(result: UnsplashSearchResult): ImageAttribution {
  return {
    authorName: result.authorName,
    authorProfileUrl: result.authorProfileUrl,
    sourceUrl: result.sourceUrl,
    license: result.license,
  };
}
