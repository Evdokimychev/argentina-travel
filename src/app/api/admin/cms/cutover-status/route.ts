import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { fetchCmsCutoverReadiness } from "@/lib/cms/cms-cutover";

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "system.settings");
  if (!auth.ok) return auth.response;

  const readiness = await fetchCmsCutoverReadiness();
  return NextResponse.json({ readiness });
}
