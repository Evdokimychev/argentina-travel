import { NextResponse } from "next/server";
import { fetchLiveExchangeRates } from "@/lib/exchange-rates";

export async function GET() {
  const payload = await fetchLiveExchangeRates();
  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
