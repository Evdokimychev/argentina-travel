import "server-only";

import { buildIntuiTransferBookUrl, buildIntuiTransferSearchUrl } from "@/lib/intui/deep-link";
import type { TransferSearchParams } from "@/lib/intui/types";
import { createTravelpayoutsPartnerLink } from "@/lib/travelpayouts/client";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { LocaleCode } from "@/types/locale";

function resolvePartnerId(): string {
  return process.env.INTUI_PARTNER_ID?.trim() || process.env.TRAVELPAYOUTS_MARKER?.trim() || "";
}

export async function createTransferAffiliateRedirectUrl(input: {
  intuiUrl: string;
  routeKey: string;
}): Promise<string> {
  const link = await createTravelpayoutsPartnerLink({
    url: input.intuiUrl,
    subId: `transfers:${input.routeKey}`,
  });

  return link.partnerUrl?.trim() || link.url;
}

export async function createTransferSearchAffiliateUrl(
  params: TransferSearchParams,
  routeKey: string
): Promise<string> {
  const intuiUrl = buildIntuiTransferSearchUrl({
    ...params,
    partnerId: resolvePartnerId(),
  });
  return createTransferAffiliateRedirectUrl({ intuiUrl, routeKey });
}

export async function createTransferBookAffiliateUrl(input: {
  bookPath: string;
  routeKey: string;
  locale: LocaleCode;
}): Promise<string> {
  const intuiUrl = buildIntuiTransferBookUrl({
    bookPath: input.bookPath,
    lang: input.locale,
    partnerId: resolvePartnerId(),
  });
  return createTransferAffiliateRedirectUrl({ intuiUrl, routeKey: input.routeKey });
}

export async function logTransferAffiliateClick(input: {
  routeKey: string;
  partnerUrl: string;
  referer?: string;
  userAgent?: string;
}): Promise<void> {
  try {
    const supabase = createSupabaseAdminClient();
    await supabase.from("affiliate_link_clicks").insert({
      experience_id: null,
      experience_slug: `transfers:${input.routeKey}`,
      partner_url: input.partnerUrl,
      referer: input.referer ?? null,
      user_agent: input.userAgent ?? null,
    });
  } catch {
    /* analytics must not block redirect */
  }
}
