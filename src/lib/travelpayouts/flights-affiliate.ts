import "server-only";

import { createTravelpayoutsPartnerLink } from "@/lib/travelpayouts/client";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function createFlightAffiliateRedirectUrl(input: {
  aviasalesUrl: string;
  routeKey: string;
}): Promise<string> {
  const link = await createTravelpayoutsPartnerLink({
    url: input.aviasalesUrl,
    subId: `flights:${input.routeKey}`,
  });

  return link.partnerUrl?.trim() || link.url;
}

export async function logFlightAffiliateClick(input: {
  routeKey: string;
  partnerUrl: string;
  referer?: string;
  userAgent?: string;
}): Promise<void> {
  try {
    const supabase = createSupabaseAdminClient();
    await supabase.from("affiliate_link_clicks").insert({
      experience_id: null,
      experience_slug: `flights:${input.routeKey}`,
      partner_url: input.partnerUrl,
      referer: input.referer ?? null,
      user_agent: input.userAgent ?? null,
    });
  } catch {
    /* analytics must not block redirect */
  }
}
