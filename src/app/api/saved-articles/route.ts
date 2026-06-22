import { NextResponse } from "next/server";
import { isSupabaseAuthEnabled } from "@/lib/auth-mode";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";
import {
  deleteSavedArticleRow,
  listUserSavedArticleRows,
  parseSavedArticleInput,
  rowsToSavedArticles,
  upsertSavedArticleRow,
} from "@/lib/saved-articles-server";

export async function GET() {
  if (!isSupabaseAuthEnabled()) {
    return NextResponse.json({ articles: [] });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const sessionUser = await loadSessionUserFromSupabase(supabase);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rows = await listUserSavedArticleRows(supabase, sessionUser.id);
    return NextResponse.json({ articles: rowsToSavedArticles(rows) });
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
    const article = parseSavedArticleInput(body);
    if (!article) {
      return NextResponse.json({ error: "Передайте slug и title" }, { status: 400 });
    }

    await upsertSavedArticleRow(supabase, sessionUser.id, article);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
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
    const slug = typeof body?.slug === "string" ? body.slug.trim() : "";
    if (!slug) {
      return NextResponse.json({ error: "Передайте slug" }, { status: 400 });
    }

    await deleteSavedArticleRow(supabase, sessionUser.id, slug);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}
