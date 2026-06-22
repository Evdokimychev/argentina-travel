import { NextResponse } from "next/server";
import { isSupabaseAuthEnabled } from "@/lib/auth-mode";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";
import {
  listUserBlogReadingHistoryRows,
  parseBlogReadingHistoryInput,
  recordBlogReadInteraction,
  rowsToBlogReadingHistory,
  upsertBlogReadingHistoryRow,
} from "@/lib/blog-reading-history-server";

export async function GET() {
  if (!isSupabaseAuthEnabled()) {
    return NextResponse.json({ entries: [] });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const sessionUser = await loadSessionUserFromSupabase(supabase);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rows = await listUserBlogReadingHistoryRows(supabase, sessionUser.id);
    return NextResponse.json({ entries: rowsToBlogReadingHistory(rows) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  if (!isSupabaseAuthEnabled()) {
    return NextResponse.json({ ok: true, localOnly: true });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const sessionUser = await loadSessionUserFromSupabase(supabase);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const entry = parseBlogReadingHistoryInput(body);
    if (!entry) {
      return NextResponse.json({ error: "Передайте slug и title" }, { status: 400 });
    }

    await upsertBlogReadingHistoryRow(supabase, sessionUser.id, entry);
    await recordBlogReadInteraction(supabase, sessionUser.id, entry.slug);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}
