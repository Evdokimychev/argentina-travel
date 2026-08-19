import { NextResponse } from "next/server";
import { clientIpFromRequest, writeCriticalAdminAuditLog } from "@/lib/admin/audit";
import { isSupabaseAuthEnabled } from "@/lib/auth-mode";
import { buildUserPrivacyExport } from "@/lib/privacy/export-user-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { unexpectedPublicApiError } from "@/lib/public-api/safe-error";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";

export async function POST(request: Request) {
  if (!isSupabaseAuthEnabled()) {
    return NextResponse.json({ error: "Privacy API unavailable" }, { status: 503 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const sessionUser = await loadSessionUserFromSupabase(supabase);

    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await buildUserPrivacyExport(supabase, sessionUser);

    const audit = await writeCriticalAdminAuditLog({
      actorUserId: sessionUser.id,
      action: "privacy.export",
      entityType: "profile",
      entityId: sessionUser.id,
      payload: { selfService: true },
      ipAddress: clientIpFromRequest(request),
    });
    if (!audit.ok) {
      return NextResponse.json(
        { error: "Не удалось записать журнал безопасности. Повторите позже.", code: "AUDIT_WRITE_FAILED" },
        { status: 503 },
      );
    }

    return NextResponse.json(payload, {
      headers: {
        "Content-Disposition": `attachment; filename="privacy-export-${sessionUser.id}.json"`,
      },
    });
  } catch {
    return NextResponse.json(unexpectedPublicApiError(), { status: 500 });
  }
}
