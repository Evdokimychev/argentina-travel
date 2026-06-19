import { NextResponse } from "next/server";
import { hasAdminCapability } from "@/lib/admin/capabilities";
import { resolveAdminCapabilitiesFromSession } from "@/lib/admin/staff";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { AdminCapability } from "@/types/admin";

export type AdminAuthResult =
  | {
      ok: true;
      actorId: string;
      capabilities: AdminCapability[];
      via: "session";
    }
  | { ok: false; response: NextResponse };

function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

function forbidden(message = "Нет доступа") {
  return NextResponse.json({ error: message, code: "FORBIDDEN" }, { status: 403 });
}

/** Authorize admin API request via Supabase session + capabilities. */
export async function authorizeAdminRequest(
  request: Request,
  requiredCapability?: AdminCapability
): Promise<AdminAuthResult> {
  void request;
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Supabase is not configured." }, { status: 503 }),
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const sessionUser = await loadSessionUserFromSupabase(supabase);

    if (sessionUser) {
      const staff = await resolveAdminCapabilitiesFromSession(sessionUser, supabase);
      if (staff) {
        if (
          requiredCapability &&
          !hasAdminCapability(staff.capabilities, requiredCapability)
        ) {
          return { ok: false, response: forbidden() };
        }
        return {
          ok: true,
          actorId: staff.userId,
          capabilities: staff.capabilities,
          via: "session",
        };
      }
    }
  } catch {
    // fall through
  }

  return { ok: false, response: unauthorized() };
}
