import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchAllToursAdmin } from "@/lib/tour-content-server";

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "marketplace.tours");
  if (!auth.ok) return auth.response;

  const supabase = createSupabaseAdminClient();
  const tours = await fetchAllToursAdmin(supabase);

  return NextResponse.json({ tours });
}
