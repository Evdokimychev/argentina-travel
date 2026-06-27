import { buildTripsterPartnerBookingUrl } from "@/lib/tripster/partner-tour-utils";

export type TripsterCheckoutContext = {
  startDate?: string | null;
  time?: string | null;
  guests?: number | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  fallbackUrl?: string | null;
};

/** Tripster `/orders/{id}/` links 404 for anonymous users — never send tourists there. */
export function isBrokenTripsterOrderPath(url: string): boolean {
  try {
    const parsed = new URL(url.trim(), "https://experience.tripster.ru");
    return /\/orders\/\d+\/?$/i.test(parsed.pathname);
  } catch {
    return /^\/?orders\/\d+\/?$/i.test(url.trim());
  }
}

export function isUsableTripsterCheckoutUrl(url: string | null | undefined): boolean {
  const trimmed = url?.trim();
  if (!trimmed) return false;
  if (isBrokenTripsterOrderPath(trimmed)) return false;

  try {
    const parsed = new URL(trimmed, "https://experience.tripster.ru");
    if (parsed.hostname.includes("tripster.ru")) return true;
    if (parsed.hostname.includes("tp.media")) return true;
    if (parsed.hostname.includes("travelpayouts")) return true;
    return /^https?:\/\//i.test(trimmed);
  } catch {
    return false;
  }
}

export function extractTripsterExperienceId(url: string | null | undefined): number | null {
  const trimmed = url?.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed, "https://experience.tripster.ru");
    const match =
      parsed.pathname.match(/\/(?:experience|mfs\/experience\/booking)\/(\d+)\/?$/i) ??
      parsed.pathname.match(/\/experience\/(\d+)\/?$/i);
    if (!match?.[1]) return null;
    const id = Number.parseInt(match[1], 10);
    return Number.isFinite(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}

/** Prefer prefilled MFS booking URL over broken API order paths. */
export function resolveTripsterCheckoutUrl(
  experienceId: number,
  orderOrPartnerUrl: string | null | undefined,
  context: TripsterCheckoutContext
): string {
  const trimmed = orderOrPartnerUrl?.trim();
  if (trimmed && isUsableTripsterCheckoutUrl(trimmed)) {
    return trimmed;
  }

  const resolvedExperienceId =
    experienceId > 0 ? experienceId : extractTripsterExperienceId(context.fallbackUrl) ?? 0;

  return buildTripsterPartnerBookingUrl(resolvedExperienceId, context);
}
