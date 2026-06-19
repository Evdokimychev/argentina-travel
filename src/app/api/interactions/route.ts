import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { insertInteractionBatch } from "@/lib/personalization/interactions-server";
import type { InteractionBatchItem } from "@/types/user-interactions";

type InteractionPayload = {
  anonymousId?: string;
  interactions?: InteractionBatchItem[];
};

function isValidItem(item: unknown): item is InteractionBatchItem {
  if (!item || typeof item !== "object") return false;
  const row = item as InteractionBatchItem;
  return (
    (row.entityType === "tour" || row.entityType === "excursion") &&
    typeof row.entityId === "string" &&
    row.entityId.trim().length > 0 &&
    (row.action === "view" || row.action === "favorite")
  );
}

export async function POST(request: Request) {
  let body: InteractionPayload;
  try {
    body = (await request.json()) as InteractionPayload;
  } catch {
    return NextResponse.json({ error: "Некорректный JSON" }, { status: 400 });
  }

  const interactions = (body.interactions ?? []).filter(isValidItem).slice(0, 40);
  if (!interactions.length) {
    return NextResponse.json({ ok: true, inserted: 0 });
  }

  let userId: string | null = null;
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createSupabaseServerClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userId = user?.id ?? null;
    } catch {
      userId = null;
    }
  }

  const inserted = await insertInteractionBatch({
    actor: {
      userId,
      anonymousId: userId ? null : body.anonymousId?.trim() || null,
    },
    interactions,
  });

  const response = NextResponse.json({ ok: true, inserted });
  if (!userId && body.anonymousId?.trim()) {
    response.cookies.set("pa_vid", body.anonymousId.trim(), {
      path: "/",
      maxAge: 60 * 60 * 24 * 90,
      sameSite: "lax",
      httpOnly: false,
    });
  }

  return response;
}
