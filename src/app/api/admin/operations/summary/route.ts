import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { fetchAdminOperationsSummary } from "@/lib/admin/operations-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "dashboard.view");
  if (!auth.ok) return auth.response;

  const supabase = createSupabaseAdminClient();
  const summary = await fetchAdminOperationsSummary(supabase);

  return NextResponse.json({ summary });
}
