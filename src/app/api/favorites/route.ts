import { NextResponse } from "next/server";
import { isSupabaseAuthEnabled } from "@/lib/auth-mode";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";
import {
  deleteUserFavoriteRow,
  hydrateUserFavorites,
  listUserFavoriteRows,
  parseFavoriteItemInput,
  upsertUserFavoriteRows,
  type FavoriteItemInput,
} from "@/lib/favorites-server";

type FavoriteRequestBody = {
  itemType?: unknown;
  itemId?: unknown;
  itemSlug?: unknown;
  items?: unknown;
};

async function parseBody(request: Request): Promise<FavoriteRequestBody> {
  try {
    return (await request.json()) as FavoriteRequestBody;
  } catch {
    return {};
  }
}

function parseItemsFromBody(body: FavoriteRequestBody): FavoriteItemInput[] {
  const explicitItems = Array.isArray(body.items) ? body.items : [];
  const directItem = parseFavoriteItemInput(body);
  const parsed = explicitItems
    .map((entry) => parseFavoriteItemInput(entry))
    .filter((item): item is FavoriteItemInput => item != null);

  if (directItem) {
    parsed.push(directItem);
  }

  const unique = new Map<string, FavoriteItemInput>();
  for (const item of parsed) {
    unique.set(`${item.itemType}:${item.itemSlug}`, item);
  }

  return [...unique.values()];
}

export async function GET() {
  if (!isSupabaseAuthEnabled()) {
    return NextResponse.json({ error: "Favorites API unavailable" }, { status: 503 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const sessionUser = await loadSessionUserFromSupabase(supabase);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rows = await listUserFavoriteRows(supabase, sessionUser.id);
    const favorites = await hydrateUserFavorites(rows);
    return NextResponse.json({ favorites });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!isSupabaseAuthEnabled()) {
    return NextResponse.json({ error: "Favorites API unavailable" }, { status: 503 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const sessionUser = await loadSessionUserFromSupabase(supabase);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await parseBody(request);
    const items = parseItemsFromBody(body);
    if (!items.length) {
      return NextResponse.json(
        { error: "Передайте itemType (tour|excursion), itemSlug и itemId" },
        { status: 400 }
      );
    }

    await upsertUserFavoriteRows(supabase, sessionUser.id, items);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  if (!isSupabaseAuthEnabled()) {
    return NextResponse.json({ error: "Favorites API unavailable" }, { status: 503 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const sessionUser = await loadSessionUserFromSupabase(supabase);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await parseBody(request);
    const item = parseFavoriteItemInput(body);
    if (!item) {
      return NextResponse.json(
        { error: "Передайте itemType (tour|excursion) и itemSlug" },
        { status: 400 }
      );
    }

    await deleteUserFavoriteRow(supabase, sessionUser.id, {
      itemType: item.itemType,
      itemSlug: item.itemSlug,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
