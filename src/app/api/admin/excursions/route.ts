import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { fetchExcursionAdminStats } from "@/lib/tripster/admin-stats";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function getToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (header?.startsWith("Bearer ")) return header.slice(7).trim();
  const url = new URL(request.url);
  return url.searchParams.get("token");
}

function isAuthorized(token: string | null): boolean {
  const expected = process.env.LEADS_ADMIN_TOKEN?.trim();
  if (!expected) return false;
  return token === expected;
}

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const token = getToken(request);
  if (!isAuthorized(token)) return unauthorized();

  const supabase = createSupabaseAdminClient();
  const stats = await fetchExcursionAdminStats(supabase);

  return NextResponse.json({ stats });
}
