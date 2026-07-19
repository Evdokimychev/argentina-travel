import { NextResponse } from "next/server";
import { buildPodborNarrative } from "@/lib/podbor/narrative";
import { buildPodborMatchResult } from "@/lib/podbor/matching";
import { fetchMarketplaceTours } from "@/data/marketplace-tours-server";
import type { PodborAiNarrativeRequest } from "@/types/podbor";
import { enforcePublicModuleAccess } from "@/lib/public-module-policy-server";

/** Builds a deterministic recommendation from the submitted answers. */
export async function POST(request: Request) {
  const moduleBlocked = await enforcePublicModuleAccess("tours", "public_write");
  if (moduleBlocked) return moduleBlocked;

  let payload: PodborAiNarrativeRequest | null = null;

  try {
    const body = (await request.json()) as { aiPayload?: PodborAiNarrativeRequest };
    payload = body.aiPayload ?? null;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!payload?.answers) {
    return NextResponse.json({ error: "aiPayload required" }, { status: 400 });
  }

  const tours = await fetchMarketplaceTours();
  const result = buildPodborMatchResult(payload.answers, tours);

  const narrative = buildPodborNarrative({
    ...result,
    aiPayload: payload,
  });

  return NextResponse.json({ narrative });
}
