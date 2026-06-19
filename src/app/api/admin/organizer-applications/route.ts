import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";

export type OrganizerApplicationRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  message: string;
  createdAt: string;
  reviewStatus: string | null;
};

function reviewStatusFromContext(context: Json | null): string | null {
  if (!context || typeof context !== "object" || Array.isArray(context)) return null;
  const status = (context as Record<string, unknown>).reviewStatus;
  return typeof status === "string" ? status : null;
}

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "marketplace.moderation");
  if (!auth.ok) return auth.response;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("contact_submissions")
    .select("id, name, email, phone, message, context, created_at")
    .eq("kind", "organizer_application")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const applications: OrganizerApplicationRow[] = (data ?? [])
    .filter((row) => {
      const status = reviewStatusFromContext(row.context);
      return !status || status === "pending";
    })
    .map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      message: row.message,
      createdAt: row.created_at,
      reviewStatus: reviewStatusFromContext(row.context),
    }));

  return NextResponse.json({ applications });
}
