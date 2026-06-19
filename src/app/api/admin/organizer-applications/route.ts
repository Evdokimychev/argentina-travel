import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchPendingOrganizerApplications } from "@/lib/admin/organizer-applications-server";

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "marketplace.moderation");
  if (!auth.ok) return auth.response;

  try {
    const supabase = createSupabaseAdminClient();
    const applications = await fetchPendingOrganizerApplications(supabase, 100, {
      throwOnError: true,
    });

    return NextResponse.json({ applications });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Query failed" },
      { status: 500 }
    );
  }
}
