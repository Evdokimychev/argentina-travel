import { NextResponse } from "next/server";
import { isSupabaseToursEnabled } from "@/lib/auth-mode";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";
import type {
  OrganizerTourDraft,
  OrganizerTourModerationStatus,
} from "@/types/organizer-tour";
import { userHasAccountRole } from "@/types/user";

function parseModerationStatus(value: string): OrganizerTourModerationStatus {
  return value === "pending" || value === "approved" || value === "rejected"
    ? value
    : "none";
}

function parseDraft(
  value: unknown,
  row: {
    owner_user_id: string;
    market_code: string;
    row_version: number;
    product_type: string;
    status: string;
    moderation_status: string;
    moderation_notes: string | null;
    updated_at: string;
  }
): OrganizerTourDraft | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = value as Partial<OrganizerTourDraft>;
  if (!candidate.id || !candidate.title) return null;

  return {
    ...candidate,
    ownerUserId: row.owner_user_id,
    marketId: row.market_code,
    rowVersion: row.row_version,
    type: row.product_type === "excursion" ? "excursion" : "tour",
    status: row.status === "published" ? "published" : "draft",
    archived: row.status === "archived" || Boolean(candidate.archived),
    moderationStatus: parseModerationStatus(row.moderation_status),
    moderationNotes: row.moderation_notes,
    updatedAt: row.updated_at,
  } as OrganizerTourDraft;
}

export async function GET() {
  if (!isSupabaseToursEnabled()) {
    return NextResponse.json({ drafts: [] });
  }

  const supabase = await createSupabaseServerClient();
  const sessionUser = await loadSessionUserFromSupabase(supabase);
  if (!sessionUser || !userHasAccountRole(sessionUser, "organizer")) {
    return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("tours")
    .select(
      "owner_user_id, market_code, row_version, product_type, status, moderation_status, moderation_notes, updated_at, editor_draft"
    )
    .eq("owner_user_id", sessionUser.id)
    .order("updated_at", { ascending: false })
    .limit(500);

  if (error) {
    return NextResponse.json(
      { error: "Не удалось загрузить предложения. Повторите попытку позже." },
      { status: 503 }
    );
  }

  return NextResponse.json({
    drafts: (data ?? [])
      .map((row) => parseDraft(row.editor_draft, row))
      .filter((draft): draft is OrganizerTourDraft => draft != null),
  });
}
