import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { captureException } from "@/lib/monitoring/sentry";
import type { Database } from "@/types/database";

type DbClient = SupabaseClient<Database>;
type AffiliateProvider = "tripster" | "youtravel" | "sputnik8";

export function sanitizeAffiliateLogUrl(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    url.username = "";
    url.password = "";
    url.search = "";
    url.hash = "";
    return url.toString().slice(0, 2048);
  } catch {
    return null;
  }
}

export async function logSafeAffiliateClick(
  supabase: DbClient,
  input: {
    provider: AffiliateProvider;
    slug: string;
    destination: string;
    fallbackDestination?: string | null;
    experienceId?: number | null;
    request: Request;
  },
): Promise<void> {
  const safeDestination =
    sanitizeAffiliateLogUrl(input.destination) ??
    sanitizeAffiliateLogUrl(input.fallbackDestination);
  if (!safeDestination) return;

  const safeReferer = sanitizeAffiliateLogUrl(input.request.headers.get("referer"));
  const userAgent = input.request.headers.get("user-agent")?.slice(0, 512) ?? null;
  const experienceSlug =
    input.provider === "tripster" ? input.slug : `${input.provider}:${input.slug}`;

  const { error } = await supabase.from("affiliate_link_clicks").insert({
    experience_id: input.provider === "tripster" ? (input.experienceId ?? null) : null,
    experience_slug: experienceSlug,
    partner_url: safeDestination,
    referer: safeReferer,
    user_agent: userAgent,
  });

  if (error) {
    captureException(error, {
      tags: { area: "affiliate-attribution", provider: input.provider, action: "click-log" },
      extra: { slug: input.slug },
    });
  }
}
