import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  deleteOrganizerPartnerWebhook,
  normalizePartnerWebhookEvents,
  updateOrganizerPartnerWebhook,
} from "@/lib/partner-webhooks";
import type { PartnerWebhookEvent } from "@/types/partner-webhook";
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

type PatchBody = {
  url?: string;
  secret?: string;
  events?: PartnerWebhookEvent[];
  active?: boolean;
};

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireOrganizerSession();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as PatchBody;
  const admin = createSupabaseAdminClient();

  const result = await updateOrganizerPartnerWebhook({
    supabase: admin,
    organizerId: auth.organizerId,
    webhookId: id,
    patch: {
      url: body.url,
      secret: body.secret,
      events: body.events ? normalizePartnerWebhookEvents(body.events) : undefined,
      active: body.active,
    },
  });

  if ("error" in result) {
    const status = result.error === "Вебхук не найден" ? 404 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ webhook: result.webhook });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireOrganizerSession();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const admin = createSupabaseAdminClient();
  const result = await deleteOrganizerPartnerWebhook({
    supabase: admin,
    organizerId: auth.organizerId,
    webhookId: id,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
