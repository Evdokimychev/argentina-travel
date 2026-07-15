import { NextResponse } from "next/server";

import { getArgentinaExchangeRates } from "@/lib/argentina-exchange-rates";

export async function GET() {
  const result = await getArgentinaExchangeRates();
  return NextResponse.json(result, {
    status: result.ok ? 200 : 503,
    headers: {
      "Cache-Control": result.ok
        ? "public, s-maxage=3600, stale-while-revalidate=3600"
        : "no-store",
    },
  });
}
