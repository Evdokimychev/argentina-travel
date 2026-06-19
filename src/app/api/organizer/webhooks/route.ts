import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  createOrganizerPartnerWebhook,
  listOrganizerPartnerWebhooks,
  normalizePartnerWebhookEvents,
} from "@/lib/partner-webhooks";
import type { PartnerWebhookEvent } from "@/types/partner-webhook";
import { userHasAccountRole } from "@/types/user";

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

export async function GET() {
  const auth = await requireOrganizerSession();
  if (!auth.ok) return auth.response;

  const admin = createSupabaseAdminClient();
  const webhooks = await listOrganizerPartnerWebhooks(admin, auth.organizerId);
  return NextResponse.json({ webhooks });
}

type CreateWebhookBody = {
  url?: string;
  secret?: string;
  events?: PartnerWebhookEvent[];
  active?: boolean;
};

export async function POST(request: Request) {
  const auth = await requireOrganizerSession();
  if (!auth.ok) return auth.response;

  const body = (await request.json().catch(() => ({}))) as CreateWebhookBody;
  const admin = createSupabaseAdminClient();
  const result = await createOrganizerPartnerWebhook({
    supabase: admin,
    organizerId: auth.organizerId,
    url: body.url ?? "",
    secret: body.secret ?? "",
    events: normalizePartnerWebhookEvents(body.events),
    active: body.active ?? true,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ webhook: result.webhook }, { status: 201 });
}
