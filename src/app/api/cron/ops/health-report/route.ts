import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { authorizeCronRequest } from "@/lib/cron/authorize-cron";
import { readCronHealthReport } from "@/lib/ops/ops-status";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cronAuth = authorizeCronRequest(request);

  if (!cronAuth.ok) {
    const adminAuth = await authorizeAdminRequest(request);
    if (!adminAuth.ok) return adminAuth.response;
  }

  const report = readCronHealthReport();
  return NextResponse.json(report);
}
