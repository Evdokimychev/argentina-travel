import { buildTripsterPartnerBookingUrl } from "@/lib/tripster/partner-tour-utils";

export type TripsterCheckoutContext = {
  startDate?: string | null;
  time?: string | null;
  guests?: number | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  messageToGuide?: string | null;
  fallbackUrl?: string | null;
};

function safelyDecodeURIComponent(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function unwrapTripsterWrapperUrl(url: string): string {
  let current = url.trim();
  for (let depth = 0; depth < 3; depth += 1) {
    try {
      const parsed = new URL(current, "https://experience.tripster.ru");
      const wrapped = parsed.searchParams.get("u")?.trim();
      if (!wrapped) return parsed.toString();
      current = safelyDecodeURIComponent(wrapped);
    } catch {
      return current;
    }
  }
  return current;
}

function hasRequiredBookingPrefillParams(url: string): boolean {
  try {
    const unwrapped = unwrapTripsterWrapperUrl(url);
    const parsed = new URL(unwrapped, "https://experience.tripster.ru");
    const date = parsed.searchParams.get("date")?.trim();
    const time = parsed.searchParams.get("time")?.trim();
    const personsCount = parsed.searchParams.get("persons_count")?.trim();
    return Boolean(date && time && personsCount);
  } catch {
    return false;
  }
}

function isTripsterBookingCheckoutUrl(url: string): boolean {
  try {
    const unwrapped = unwrapTripsterWrapperUrl(url);
    const parsed = new URL(unwrapped, "https://experience.tripster.ru");
    return /\/(?:mfs\/)?experience\/booking\/\d+\/?$/i.test(parsed.pathname);
  } catch {
    return /\/(?:mfs\/)?experience\/booking\/\d+\/?$/i.test(url.trim());
  }
}

function rebuildTripsterBookingUrlFromContext(
  experienceId: number,
  context: TripsterCheckoutContext,
  sourceUrl?: string | null
): string {
  const sourceExperienceId = extractTripsterExperienceId(sourceUrl);
  const contextExperienceId = extractTripsterExperienceId(context.fallbackUrl);
  const resolvedExperienceId =
    sourceExperienceId ?? (experienceId > 0 ? experienceId : contextExperienceId ?? 0);

  return buildTripsterPartnerOpenUrl(resolvedExperienceId, {
    ...context,
    fallbackUrl: context.fallbackUrl ?? sourceUrl ?? null,
  });
}

/** Tripster `/orders/{id}/` links 404 for anonymous users — rewrite to `/experience/order/{id}/`. */
export function isBrokenTripsterOrderPath(url: string): boolean {
  try {
    const parsed = new URL(url.trim(), "https://experience.tripster.ru");
    return /\/orders\/\d+\/?$/i.test(parsed.pathname);
  } catch {
    return /^\/?orders\/\d+\/?$/i.test(url.trim());
  }
}

export function extractTripsterOrderId(url: string | null | undefined): number | null {
  const trimmed = url?.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed, "https://experience.tripster.ru");
    const match =
      parsed.pathname.match(/\/experience\/order\/(\d+)\/?$/i) ??
      parsed.pathname.match(/\/orders\/(\d+)\/?$/i);
    if (!match?.[1]) return null;
    const id = Number.parseInt(match[1], 10);
    return Number.isFinite(id) && id > 0 ? id : null;
  } catch {
    const match = trimmed.match(/^\/?(?:experience\/)?order\/(\d+)\/?$/i) ?? trimmed.match(/^\/?orders\/(\d+)\/?$/i);
    if (!match?.[1]) return null;
    const id = Number.parseInt(match[1], 10);
    return Number.isFinite(id) && id > 0 ? id : null;
  }
}

/** Checkout page for a created Tripster order — prefilled with all booking data. */
export function buildTripsterExperienceOrderUrl(orderId: number): string {
  return `https://experience.tripster.ru/experience/order/${orderId}/`;
}

/** Rewrites legacy `/orders/{id}/` paths to the working checkout route. */
export function normalizeTripsterOrderUrl(url: string): string {
  const orderId = extractTripsterOrderId(url);
  if (orderId) return buildTripsterExperienceOrderUrl(orderId);
  return url;
}

export function isUsableTripsterCheckoutUrl(url: string | null | undefined): boolean {
  const trimmed = url?.trim();
  if (!trimmed) return false;
  if (isBrokenTripsterOrderPath(trimmed)) return false;
  if (extractTripsterOrderId(trimmed)) return true;

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

    if (parsed.hostname.includes("tp.media") || parsed.hostname.includes("travelpayouts")) {
      const embedded = parsed.searchParams.get("u");
      if (embedded) {
        return extractTripsterExperienceId(decodeURIComponent(embedded));
      }
    }

    const match = parsed.pathname.match(
      /\/(?:mfs\/)?experience(?:\/booking)?\/(\d+)\/?$/i
    );
    if (!match?.[1]) return null;
    const id = Number.parseInt(match[1], 10);
    return Number.isFinite(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}

/** Canonical public page for a Tripster experience (not checkout). */
export function buildTripsterExperiencePageUrl(
  experienceId: number,
  tripsterUrl?: string | null
): string {
  if (!experienceId) return tripsterUrl?.trim() || "https://experience.tripster.ru/";

  const stored = tripsterUrl?.trim();
  if (stored && !isBrokenTripsterOrderPath(stored)) {
    const extracted = extractTripsterExperienceId(stored);
    if (!extracted || extracted === experienceId) {
      return stored;
    }
  }

  return `https://experience.tripster.ru/experience/${experienceId}/`;
}

export function partnerUrlMatchesExperience(
  partnerUrl: string | null | undefined,
  experienceId: number
): boolean {
  if (!partnerUrl?.trim() || !experienceId) return false;
  const extracted = extractTripsterExperienceId(partnerUrl);
  return extracted === experienceId;
}

/** Prefer order checkout URL, then prefilled booking URL over broken API order paths. */
export function resolveTripsterCheckoutUrl(
  experienceId: number,
  orderOrPartnerUrl: string | null | undefined,
  context: TripsterCheckoutContext,
  orderId?: number | null
): string {
  const resolvedOrderId = orderId ?? extractTripsterOrderId(orderOrPartnerUrl);
  if (resolvedOrderId) {
    return buildTripsterExperienceOrderUrl(resolvedOrderId);
  }

  const trimmed = orderOrPartnerUrl?.trim();
  if (trimmed && isUsableTripsterCheckoutUrl(trimmed)) {
    if (isTripsterBookingCheckoutUrl(trimmed) && !hasRequiredBookingPrefillParams(trimmed)) {
      return rebuildTripsterBookingUrlFromContext(experienceId, context, trimmed);
    }
    return trimmed;
  }

  return rebuildTripsterBookingUrlFromContext(experienceId, context, trimmed);
}

/** Direct Tripster checkout URL with form context — reliable client-side open target. */
export function buildTripsterPartnerOpenUrl(
  experienceId: number,
  context: TripsterCheckoutContext
): string {
  const resolvedExperienceId =
    experienceId > 0 ? experienceId : extractTripsterExperienceId(context.fallbackUrl) ?? 0;

  return buildTripsterPartnerBookingUrl(resolvedExperienceId, {
    startDate: context.startDate,
    time: context.time,
    guests: context.guests,
    fallbackUrl: context.fallbackUrl,
    name: context.name,
    email: context.email,
    phone: context.phone,
    messageToGuide: context.messageToGuide,
  });
}

export type TripsterBookingApiResponse = {
  ok?: boolean;
  mode?: string;
  orderId?: number;
  orderUrl?: string | null;
  fallbackUrl?: string | null;
};

/** Prefer server-provided affiliate/fallback URL, then order checkout, then client-built booking URL. */
export function resolveTripsterBookingRedirectFromApi(input: {
  response: TripsterBookingApiResponse;
  experienceId: number;
  context: TripsterCheckoutContext;
}): string {
  const { response, experienceId, context } = input;

  if (response.mode === "affiliate_fallback" || !response.ok) {
    const serverFallback = response.fallbackUrl?.trim();
    if (serverFallback && hasRequiredBookingPrefillParams(serverFallback)) {
      return serverFallback;
    }
    return rebuildTripsterBookingUrlFromContext(experienceId, context, serverFallback);
  }

  return resolveTripsterCheckoutUrl(
    experienceId,
    response.orderUrl ?? response.fallbackUrl,
    context,
    response.orderId
  );
}
