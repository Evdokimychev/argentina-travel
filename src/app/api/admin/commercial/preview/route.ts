import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { isUuid } from "@/lib/admin/user-identity-management";
import { resolveOrganizerCommercialContract } from "@/lib/commercial/entitlement-resolver-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "users.manage");
  if (!auth.ok) return auth.response;
  const organizerUserId = new URL(request.url).searchParams.get("organizerUserId");
  if (!isUuid(organizerUserId)) {
    return NextResponse.json({ error: "Некорректный организатор" }, { status: 400 });
  }
  const contract = await resolveOrganizerCommercialContract(
    createSupabaseAdminClient(),
    organizerUserId
  );
  return NextResponse.json(
    { contract },
    { headers: { "Cache-Control": "private, no-store, max-age=0" } }
  );
}
