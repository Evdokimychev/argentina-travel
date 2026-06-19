import { NextResponse } from "next/server";
import { fetchPublicHealthSnapshot } from "@/lib/monitoring/health-public";

export async function GET() {
  const health = await fetchPublicHealthSnapshot();

  return NextResponse.json(health, { status: health.ok ? 200 : 503 });
}
