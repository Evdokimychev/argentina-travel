import "server-only";

import { NextResponse } from "next/server";
import { resolveOrganizerCommercialContract, guardOrganizerEntitlement } from "@/lib/commercial/entitlement-resolver-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";
import type { MobilityVertical } from "@/types/mobility";
import { userHasAccountRole } from "@/types/user";

export async function authorizeOrganizerMobility(vertical: MobilityVertical) {
  const supabase = await createSupabaseServerClient();
  const user = await loadSessionUserFromSupabase(supabase);
  if (!user || !userHasAccountRole(user, "organizer")) {
    return { ok: false as const, response: NextResponse.json({ error: "Требуется роль организатора" }, { status: 403 }) };
  }
  const contract = await resolveOrganizerCommercialContract(createSupabaseAdminClient(), user.id);
  const key = vertical === "rental" ? "module.cars.manage" : "module.transfers.manage";
  const decision = guardOrganizerEntitlement(contract, key);
  if (!decision.allowed) {
    const unavailable = decision.reason === "contract_unavailable";
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          error: unavailable
            ? "Не удалось безопасно проверить тариф. Повторите позже."
            : "Этот модуль не входит в текущий тариф.",
          code: decision.reason,
        },
        { status: unavailable ? 503 : 403 },
      ),
    };
  }
  return { ok: true as const, user };
}
