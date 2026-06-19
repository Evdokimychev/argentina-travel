import { NextResponse } from "next/server";
import { getFlag } from "@/lib/feature-flags/server";
import { resolveInteractionActor } from "@/lib/personalization/interaction-context-server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key")?.trim();
  if (!key) {
    return NextResponse.json({ error: "Укажите key" }, { status: 400 });
  }

  const actor = await resolveInteractionActor();
  const actorId = actor.userId ?? actor.anonymousId ?? null;
  const enabled = await getFlag(key, actorId);

  return NextResponse.json({
    key,
    enabled,
  });
}
