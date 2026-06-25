import type { YouTravelTour } from "@/lib/youtravel/types";
import type { TourDetail, TourListing } from "@/types";

export const PARTNER_YOUTRAVEL_BADGE_LABEL = "Партнёр YouTravel.me";

export const PARTNER_YOUTRAVEL_BADGE_HINT =
  "Бронирование и оплата проходят на YouTravel.me. Мы получаем партнёрскую комиссию при бронировании.";

export function youtravelTourListingId(youtravelId: number | string): string {
  return `youtravel-${youtravelId}`;
}

export function isYouTravelPartnerListing(
  tour: Pick<TourListing, "partnerSource" | "id">
): boolean {
  return tour.partnerSource === "youtravel" || tour.id.startsWith("youtravel-");
}

export function isYouTravelPartnerDetail(
  tour: Pick<TourDetail, "partnerSource" | "id">
): boolean {
  return tour.partnerSource === "youtravel" || tour.id.startsWith("youtravel-");
}

export function resolveYouTravelTourId(tour: YouTravelTour): number | null {
  const raw = tour.id ?? tour.externalId;
  if (raw == null) return null;
  const parsed = typeof raw === "number" ? raw : Number.parseInt(String(raw), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function resolveYouTravelCountryName(tour: YouTravelTour): string | null {
  if (Array.isArray(tour.countries) && tour.countries.length) {
    return tour.countries[0]?.trim() || null;
  }
  const country = tour.country;
  if (typeof country === "string") return country.trim() || null;
  if (country && typeof country === "object") {
    return country.nameRu?.trim() || country.name?.trim() || null;
  }
  return tour.destination?.trim() || null;
}

export function matchesYouTravelSyncCountry(
  tour: YouTravelTour,
  matchers: string[]
): boolean {
  if (!matchers.length) return true;

  const haystack = [
    ...(Array.isArray(tour.countries) ? tour.countries : []),
    resolveYouTravelCountryName(tour),
    typeof tour.region === "string" ? tour.region : tour.region?.nameRu ?? tour.region?.name,
    typeof tour.city === "string" ? tour.city : tour.city?.nameRu ?? tour.city?.name,
    tour.destination,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return matchers.some((matcher) => haystack.includes(matcher.toLowerCase()));
}

export function slugifyYouTravelTitle(title: string): string {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i",
    й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t",
    у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "",
    э: "e", ю: "yu", я: "ya",
  };

  const normalized = title
    .trim()
    .toLowerCase()
    .split("")
    .map((char) => map[char] ?? char)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return normalized || "tour";
}

export function buildYouTravelTourSlug(title: string, id: number): string {
  return `${slugifyYouTravelTitle(title)}-yt${id}`;
}

export function buildYouTravelTourUrl(id: number, _slug?: string | null): string {
  return `https://youtravel.me/tours/${id}`;
}

export function parseYouTravelTourPathFromUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;

  try {
    const parsed = new URL(url.trim());
    const hostname = parsed.hostname.replace(/^www\./i, "");
    if (hostname !== "youtravel.me") return null;

    const match = parsed.pathname.match(/\/tours\/([^/?#]+)/i);
    const segment = match?.[1]?.trim();
    return segment || null;
  } catch {
    return null;
  }
}

export function resolveYouTravelBookingPathSegment(
  tourId: number,
  options?: { youtravelUrl?: string | null }
): string {
  const fromPartnerUrl = parseYouTravelTourPathFromUrl(options?.youtravelUrl);
  if (fromPartnerUrl) return fromPartnerUrl;
  return String(tourId);
}

export function parseYouTravelOfferDateId(dateId: string): {
  offerId: number;
} | null {
  const match = dateId.trim().match(/^yt-offer-(\d+)-/i);
  if (!match) return null;
  const offerId = Number.parseInt(match[1], 10);
  return Number.isFinite(offerId) ? { offerId } : null;
}

export function buildYouTravelPartnerBookingUrl(
  tourId: number,
  options?: {
    tourSlug?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    guests?: number | null;
    fallbackUrl?: string | null;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    offerId?: number | null;
  }
): string {
  const fallback = options?.fallbackUrl?.trim();
  if (!tourId) return fallback || "https://youtravel.me/";

  const pathSegment = resolveYouTravelBookingPathSegment(tourId, {
    youtravelUrl: fallback,
  });

  try {
    const url = new URL(`https://youtravel.me/tours/${pathSegment}`);
    if (options?.startDate) url.searchParams.set("start_date", options.startDate);
    if (options?.endDate) url.searchParams.set("end_date", options.endDate);
    if (options?.guests && options.guests > 0) {
      url.searchParams.set("guests", String(options.guests));
    }
    if (options?.offerId && options.offerId > 0) {
      url.searchParams.set("offer_id", String(options.offerId));
    }
    if (options?.name?.trim()) url.searchParams.set("name", options.name.trim());
    if (options?.email?.trim()) url.searchParams.set("email", options.email.trim());
    if (options?.phone?.trim()) url.searchParams.set("phone", options.phone.trim());
    return url.toString();
  } catch {
    return fallback || buildYouTravelTourUrl(tourId);
  }
}

/** Cached partner_url from sync may be a YouTravel offer payment deep link — not a tourist booking URL. */
export function isUsableYouTravelAffiliateRedirectUrl(url: string | null | undefined): boolean {
  if (!url?.trim()) return false;

  try {
    const parsed = new URL(url.trim());
    const embeddedPath = parsed.searchParams.get("path") ?? "";
    if (embeddedPath.includes("/lk/pay")) return false;

    if (parsed.hostname.endsWith("youtravel.me")) return true;
    if (parsed.hostname.includes("tp.media")) return true;
    if (parsed.hostname.includes("travelpayouts")) return true;
    if (parsed.hostname.includes("g2afse.com") && !embeddedPath.includes("/lk/pay")) return true;

    return false;
  } catch {
    return false;
  }
}

export function buildYouTravelAffiliateFallbackPath(input: {
  slug: string;
  startDate: string;
  endDate?: string | null;
  guests: number;
  name?: string;
  email?: string;
  phone?: string;
  offerId?: number | null;
}): string {
  const search = new URLSearchParams({
    start_date: input.startDate,
    guests: String(input.guests),
  });
  if (input.endDate) search.set("end_date", input.endDate);
  if (input.offerId && input.offerId > 0) search.set("offer_id", String(input.offerId));
  if (input.name) search.set("name", input.name);
  if (input.email) search.set("email", input.email);
  if (input.phone) search.set("phone", input.phone);
  return `/api/affiliate/go/${input.slug}?${search.toString()}`;
}
