import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";

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

  const [newsletter, contacts] = await Promise.all([
    supabase
      .from("newsletter_subscribers")
      .select("id, email, source, locale, status, created_at")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("contact_submissions")
      .select("id, kind, name, email, phone, message, context, page_url, created_at")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  if (newsletter.error || contacts.error) {
    return NextResponse.json(
      {
        error: newsletter.error?.message ?? contacts.error?.message ?? "Query failed",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    newsletter: newsletter.data ?? [],
    contacts: contacts.data ?? [],
  });
}
