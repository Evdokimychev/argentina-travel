import { NextResponse } from "next/server";
import { fetchSiteLegal } from "@/lib/site-settings-server";
import { formatSiteLegalLine } from "@/lib/site-legal-display";

/** Public read-only legal requisites for footer and contacts. */
export async function GET() {
  const legal = await fetchSiteLegal();
  return NextResponse.json({
    legalLine: formatSiteLegalLine(legal),
    supportEmail: legal.supportEmail?.trim() || null,
    companyName: legal.companyName?.trim() || null,
  });
}
