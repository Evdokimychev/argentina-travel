import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "operations.leads");
  if (!auth.ok) return auth.response;

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
