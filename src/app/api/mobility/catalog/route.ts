import { NextResponse } from "next/server";
import { mobilityModuleBlockedResponse, resolveMobilityModuleAccess } from "@/lib/mobility/module-policy-server";
import { callMobilityRpc } from "@/lib/mobility/rpc-server";
import type { MobilityPublicCatalog } from "@/types/mobility";
import { isMobilityVertical } from "@/types/mobility";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const vertical = url.searchParams.get("vertical");
  const marketId = url.searchParams.get("marketId")?.trim().toLowerCase();
  if (!isMobilityVertical(vertical) || !marketId || !/^[a-z0-9][a-z0-9_-]{1,39}$/.test(marketId)) {
    return NextResponse.json({ error: "Укажите тип и рынок" }, { status: 400 });
  }
  const access = await resolveMobilityModuleAccess(vertical);
  if (!access.allowed) return mobilityModuleBlockedResponse(access);
  const result = await callMobilityRpc<MobilityPublicCatalog>("mobility_public_catalog", {
    p_vertical: vertical,
    p_market_id: marketId,
  });
  if (!result.ok) return NextResponse.json({ error: "Каталог временно недоступен. Повторите позже.", code: result.code }, { status: 503 });
  const catalog = access.allowNativeOffers ? result.data : { ...result.data, offers: [] };
  return NextResponse.json({ catalog }, { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } });
}
