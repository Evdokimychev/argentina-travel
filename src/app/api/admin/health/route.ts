import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchAdminHealthSnapshot } from "@/lib/admin/health-server";

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "dashboard.view");
  if (!auth.ok) return auth.response;

  const supabase = createSupabaseAdminClient();
  const health = await fetchAdminHealthSnapshot(supabase);

  return NextResponse.json(
    health,
    { status: health.ok ? 200 : 503 }
  );
}
