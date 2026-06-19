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
      via: "session" | "legacy_token";
    }
  | { ok: false; response: NextResponse };

function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

function forbidden(message = "Нет доступа") {
  return NextResponse.json({ error: message, code: "FORBIDDEN" }, { status: 403 });
}

function getLegacyToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (header?.startsWith("Bearer ")) return header.slice(7).trim();
  const url = new URL(request.url);
  return url.searchParams.get("token");
}

function isLegacyTokenAuthorized(token: string | null): boolean {
  const expected = process.env.LEADS_ADMIN_TOKEN?.trim();
  if (!expected || !token) return false;
  return token === expected;
}

/**
 * Authorize admin API request via Supabase session (preferred) or legacy LEADS_ADMIN_TOKEN.
 */
export async function authorizeAdminRequest(
  request: Request,
  requiredCapability?: AdminCapability
): Promise<AdminAuthResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Supabase is not configured." }, { status: 503 }),
    };
  }

  // Session auth
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
    // Fall through to legacy token
  }

  // Legacy token (deprecated — remove after all admins use session auth)
  const legacyToken = getLegacyToken(request);
  if (isLegacyTokenAuthorized(legacyToken)) {
    return {
      ok: true,
      actorId: "legacy-token",
      capabilities: ["*"],
      via: "legacy_token",
    };
  }

  return { ok: false, response: unauthorized() };
}
