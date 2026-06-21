/**
 * Server/script-only Pexels client. Do not import from client components.
 */
import type { ImageAttribution } from "./types";
import { ROLE_WIDTHS } from "./sizes";

const USER_AGENT = "argentina-travel-image-provider/1.0 (https://www.goargentina.ru)";

export interface PexelsSearchResult {
  id: string;
  downloadUrl: string;
  sourceUrl: string;
  authorName: string;
  authorProfileUrl?: string;
  license: string;
  title?: string;
}

function getKey(): string {
  return process.env.PEXELS_API_KEY ?? "";
}

function pexelsDownloadUrl(
  src: { original?: string; large2x?: string; large?: string; medium?: string },
  width: number,
): string {
  if (width >= 1600 && src.original) return src.original;
  if (width >= 1200 && src.large2x) return src.large2x;
  return src.large ?? src.medium ?? src.original ?? "";
}

export async function searchPexels(
  query: string,
  width: number = ROLE_WIDTHS.hero,
): Promise<PexelsSearchResult[]> {
  const key = getKey();
  if (!key) return [];

  const params = new URLSearchParams({ query, orientation: "landscape", per_page: "8" });
  const res = await fetch(`https://api.pexels.com/v1/search?${params}`, {
    headers: {
      Authorization: key,
      "User-Agent": USER_AGENT,
    },
  });

  if (!res.ok) throw new Error(`Pexels HTTP ${res.status}`);

  const data = (await res.json()) as {
    photos?: Array<{
      id: number;
      url?: string;
      photographer?: string;
      photographer_url?: string;
      alt?: string;
      src?: { original?: string; large2x?: string; large?: string; medium?: string };
    }>;
  };

  return (data.photos ?? []).map((p) => ({
    id: String(p.id),
    downloadUrl: pexelsDownloadUrl(p.src ?? {}, width),
    sourceUrl: p.url ?? `https://www.pexels.com/photo/${p.id}/`,
    authorName: p.photographer ?? "Pexels",
    authorProfileUrl: p.photographer_url,
    license: "Pexels License",
    title: p.alt ?? undefined,
  }));
}

export function toPexelsAttribution(result: PexelsSearchResult): ImageAttribution {
  return {
    authorName: result.authorName,
    authorProfileUrl: result.authorProfileUrl,
    sourceUrl: result.sourceUrl,
    license: result.license,
  };
}
