import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { fetchOwnerOnboardingSnapshot } from "@/lib/admin/owner-onboarding-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "dashboard.view");
  if (!auth.ok) return auth.response;

  const snapshot = await fetchOwnerOnboardingSnapshot(
    createSupabaseAdminClient(),
    auth.capabilities,
  );
  return NextResponse.json(
    { snapshot },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
