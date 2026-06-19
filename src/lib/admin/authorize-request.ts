import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { hasAdminCapability } from "@/lib/admin/capabilities";
import { resolveAdminCapabilitiesFromSession } from "@/lib/admin/staff";
import { setSentryUserContext } from "@/lib/monitoring/sentry";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { AdminCapability } from "@/types/admin";

export type AdminAuthResult =
  | {
      ok: true;
      actorId: string;
      capabilities: AdminCapability[];
      via: "session" | "service_role";
    }
  | { ok: false; response: NextResponse };

function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

function forbidden(message = "Нет доступа") {
  return NextResponse.json({ error: message, code: "FORBIDDEN" }, { status: 403 });
}

function parseBearerToken(request: Request): string | null {
  const raw = request.headers.get("authorization")?.trim();
  if (!raw) return null;
  const [scheme, ...tokenParts] = raw.split(" ");
  if (scheme.toLowerCase() !== "bearer") return null;
  const token = tokenParts.join(" ").trim();
  return token || null;
}

function compareSecret(input: string, secret: string): boolean {
  const left = Buffer.from(input, "utf8");
  const right = Buffer.from(secret, "utf8");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/** Authorize admin API request via Supabase session + capabilities. */
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

  const serviceRoleToken = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const bearerToken = parseBearerToken(request);
  if (serviceRoleToken && bearerToken && compareSecret(bearerToken, serviceRoleToken)) {
    setSentryUserContext({ id: "service-role", role: "service_role" });
    return {
      ok: true,
      actorId: "service-role",
      capabilities: ["*"],
      via: "service_role",
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const sessionUser = await loadSessionUserFromSupabase(supabase);

    if (sessionUser) {
      const staff = await resolveAdminCapabilitiesFromSession(sessionUser, supabase);
      if (staff) {
        setSentryUserContext({
          id: sessionUser.id,
          email: sessionUser.email,
          role: sessionUser.role,
          roles: sessionUser.roles,
        });
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
