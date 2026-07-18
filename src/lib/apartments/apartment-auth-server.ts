import "server-only";

import { NextResponse } from "next/server";
import { resolveOrganizerCommercialContract, guardOrganizerEntitlement } from "@/lib/commercial/entitlement-resolver-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";
import { userHasAccountRole } from "@/types/user";

export async function authorizeApartmentOrganizer() {
  try {
    const session = await createSupabaseServerClient();
    const user = await loadSessionUserFromSupabase(session);
    if (!user || !userHasAccountRole(user, "organizer")) {
      return { ok: false as const, response: NextResponse.json({ error: "Доступ запрещён" }, { status: 403 }) };
    }
    const admin = createSupabaseAdminClient();
    const contract = await resolveOrganizerCommercialContract(admin, user.id);
    const access = guardOrganizerEntitlement(contract, "module.apartments.manage");
    if (!access.allowed) {
      return { ok: false as const, response: NextResponse.json({
        error: access.reason === "contract_unavailable" ? "Не удалось безопасно проверить тариф. Повторите позже." : "Управление апартаментами не входит в текущий тариф.",
        code: access.reason,
      }, { status: access.reason === "contract_unavailable" ? 503 : 403 }) };
    }
    return { ok: true as const, user, admin };
  } catch {
    return { ok: false as const, response: NextResponse.json({ error: "Сервис временно недоступен" }, { status: 503 }) };
  }
}

export async function isApartmentOwnerCandidate(userId: string): Promise<boolean> {
  try {
    const db = createSupabaseAdminClient();
    const { data, error } = await db.from("profiles").select("id, roles").eq("id", userId).maybeSingle();
    return !error && Boolean(data?.roles?.some((role) => role === "organizer" || role === "admin"));
  } catch {
    return false;
  }
}
