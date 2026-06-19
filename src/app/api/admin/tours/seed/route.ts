import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { clientIpFromRequest, writeAdminAuditLog } from "@/lib/admin/audit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { buildMarketplaceSeedRows } from "@/lib/tour-content-seed";
import { upsertTourFromCanonical } from "@/lib/tour-content-server";

export async function POST(request: Request) {
  const auth = await authorizeAdminRequest(request, "marketplace.tours");
  if (!auth.ok) return auth.response;

  const supabase = createSupabaseAdminClient();
  const rows = buildMarketplaceSeedRows();
  let seeded = 0;
  const errors: string[] = [];

  for (const { tour, ownerUserId } of rows) {
    const result = await upsertTourFromCanonical(supabase, tour, ownerUserId);
    if ("error" in result) {
      errors.push(`${tour.slug}: ${result.error}`);
    } else {
      seeded += 1;
    }
  }

  await writeAdminAuditLog({
    actorUserId: auth.actorId,
    action: "tours.seed",
    entityType: "tours",
    payload: { seeded, total: rows.length, errorCount: errors.length },
    ipAddress: clientIpFromRequest(request),
  });

  return NextResponse.json({
    ok: true,
    seeded,
    total: rows.length,
    errors: errors.length ? errors : undefined,
  });
}
