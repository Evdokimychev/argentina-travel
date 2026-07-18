import { NextResponse } from "next/server";
import { resolveRemoteAcceptanceSnapshot } from "@/lib/staging-acceptance/remote-environment";

export const dynamic = "force-dynamic";

export async function GET() {
  const snapshot = resolveRemoteAcceptanceSnapshot(process.env);
  if (!snapshot) {
    return NextResponse.json({ enabled: false }, { status: 404 });
  }
  return NextResponse.json(snapshot, {
    headers: { "Cache-Control": "no-store" },
  });
}
