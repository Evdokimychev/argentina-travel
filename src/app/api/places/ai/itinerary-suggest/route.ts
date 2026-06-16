import { NextResponse } from "next/server";
import { fetchPlacesServer } from "@/lib/places-repository";
import { buildPlaceRelations, haversineDistanceKm } from "@/lib/places-relations";
import { filterPlaces, getDefaultPlaceCatalogFilters } from "@/lib/places-catalog-filters";
import type { PlaceListing } from "@/types/place";

export type ItinerarySuggestRequest = {
  /** Starting place slug or free-text region preference */
  startSlug?: string;
  region?: string;
  /** Trip length in days */
  durationDays?: number;
  /** Preferred categories */
  categories?: string[];
  /** Tags of interest */
  tags?: string[];
  /** Max places to suggest */
  limit?: number;
};

export type ItinerarySuggestStop = {
  dayNumber: number;
  place: PlaceListing;
  reason: string;
};

export type ItinerarySuggestResponse = {
  /** Placeholder flag — full AI generation not implemented */
  aiGenerated: false;
  method: "rule-based";
  title: string;
  durationDays: number;
  stops: ItinerarySuggestStop[];
  message: string;
};

/**
 * Rule-based itinerary suggestion stub for future AI integration.
 * Uses Place database + relation graph; returns structured JSON for clients.
 */
export async function POST(request: Request) {
  let body: ItinerarySuggestRequest;
  try {
    body = (await request.json()) as ItinerarySuggestRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const durationDays = Math.min(Math.max(body.durationDays ?? 5, 1), 21);
  const limit = Math.min(body.limit ?? durationDays + 2, 15);

  const allPlaces = await fetchPlacesServer();

  let pool = allPlaces;
  if (body.region) {
    pool = filterPlaces(pool, getDefaultPlaceCatalogFilters({ region: body.region }));
  }
  if (body.categories?.length) {
    pool = pool.filter((p) => body.categories!.includes(p.category));
  }
  if (body.tags?.length) {
    const tagSet = new Set(body.tags.map((t) => t.toLowerCase()));
    pool = pool.filter((p) => p.tags.some((t) => tagSet.has(t.toLowerCase())));
  }

  if (pool.length === 0) pool = allPlaces;

  let start: PlaceListing | undefined;
  if (body.startSlug) {
    start = allPlaces.find((p) => p.slug === body.startSlug);
  }
  if (!start) {
    start = [...pool].sort((a, b) => b.popularity - a.popularity)[0];
  }

  const relations = buildPlaceRelations(start, pool, { maxResults: limit * 2 });
  const ordered: PlaceListing[] = [start];
  const used = new Set<string>([start.slug]);

  for (const rel of relations) {
    if (ordered.length >= limit) break;
    if (used.has(rel.place.slug)) continue;
    ordered.push(rel.place);
    used.add(rel.place.slug);
  }

  while (ordered.length < Math.min(limit, pool.length)) {
    const last = ordered[ordered.length - 1];
    const next = pool
      .filter((p) => !used.has(p.slug))
      .sort(
        (a, b) =>
          haversineDistanceKm(last.latitude, last.longitude, a.latitude, a.longitude) -
          haversineDistanceKm(last.latitude, last.longitude, b.latitude, b.longitude),
      )[0];
    if (!next) break;
    ordered.push(next);
    used.add(next.slug);
  }

  const stops: ItinerarySuggestStop[] = ordered.map((place, index) => {
    const dayNumber = Math.min(
      durationDays,
      Math.floor((index / ordered.length) * durationDays) + 1,
    );
    const rel = relations.find((r) => r.place.slug === place.slug);
    return {
      dayNumber,
      place,
      reason: rel?.reason ?? (index === 0 ? "Стартовая точка" : "Географическая близость"),
    };
  });

  const response: ItinerarySuggestResponse = {
    aiGenerated: false,
    method: "rule-based",
    title: body.region
      ? `Маршрут по региону «${body.region}» на ${durationDays} дней`
      : `Маршрут от ${start.name} на ${durationDays} дней`,
    durationDays,
    stops,
    message:
      "Заглушка API: правила на основе графа связей. Полная AI-генерация — в следующих итерациях.",
  };

  return NextResponse.json(response);
}

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/places/ai/itinerary-suggest",
    method: "POST",
    description: "Rule-based itinerary suggestion stub. Accepts ItinerarySuggestRequest JSON.",
  });
}
