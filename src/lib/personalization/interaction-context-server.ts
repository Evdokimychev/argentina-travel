import "server-only";

import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { InteractionActor } from "@/lib/personalization/interactions-server";

export async function resolveInteractionActor(): Promise<InteractionActor> {
  let userId: string | null = null;

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  } catch {
    userId = null;
  }

  if (userId) {
    return { userId };
  }

  const cookieStore = await cookies();
  const anonymousId =
    cookieStore.get("pa_vid")?.value ?? null;

  return { anonymousId };
}
