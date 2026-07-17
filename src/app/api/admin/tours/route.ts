import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchAllToursAdmin } from "@/lib/tour-content-server";

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "marketplace.tours");
  if (!auth.ok) return auth.response;

  const supabase = createSupabaseAdminClient();
  const url = new URL(request.url);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? 50) || 50));
  const offset = Math.max(0, Number(url.searchParams.get("offset") ?? 0) || 0);
  const rawStatus = url.searchParams.get("status");
  const status = rawStatus === "draft" || rawStatus === "published" || rawStatus === "archived"
    ? rawStatus
    : undefined;
  const rawProductType = url.searchParams.get("productType");
  const productType = rawProductType === "tour" || rawProductType === "excursion"
    ? rawProductType
    : undefined;
  const result = await fetchAllToursAdmin(supabase, { limit, offset, status, productType });
  if (result.error) {
    return NextResponse.json(
      { error: "Не удалось загрузить предложения. Повторите попытку позже." },
      { status: 503 }
    );
  }

  return NextResponse.json({ ...result, limit, offset });
}
