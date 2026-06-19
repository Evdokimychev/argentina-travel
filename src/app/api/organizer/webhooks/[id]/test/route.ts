import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { sendPartnerWebhookTestPing } from "@/lib/partner-webhooks";
import { userHasAccountRole } from "@/types/user";

type RouteContext = { params: Promise<{ id: string }> };

async function requireOrganizerSession() {
  if (!isSupabaseConfigured()) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Интеграции недоступны" }, { status: 503 }),
    };
  }

  const supabase = await createSupabaseServerClient();
  const sessionUser = await loadSessionUserFromSupabase(supabase);

  if (!sessionUser || !userHasAccountRole(sessionUser, "organizer")) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Доступ запрещён" }, { status: 403 }),
    };
  }

  return { ok: true as const, organizerId: sessionUser.id };
}

export async function POST(_request: Request, context: RouteContext) {
  const auth = await requireOrganizerSession();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const result = await sendPartnerWebhookTestPing({
    organizerId: auth.organizerId,
    webhookId: id,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, delivery: result.delivery ?? null },
      { status: result.error === "Вебхук не найден" ? 404 : 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    delivery: result.delivery,
  });
}
