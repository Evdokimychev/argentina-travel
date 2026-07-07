import { NextResponse } from "next/server";
import { buildQuickExplorePayload } from "@/lib/quick-explore/build-payload";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const payload = await buildQuickExplorePayload();
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch (error) {
    console.error("[quick-explore]", error);
    return NextResponse.json({ error: "Не удалось загрузить данные карты" }, { status: 500 });
  }
}
