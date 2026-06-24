import { parsePartnerTourDateId } from "@/lib/tripster/partner-tour-price";
import type {
  TourCustomBookingLink,
  TourCustomBookingLinkPublic,
} from "@/types/tour-custom-booking-link";
import type { TourDetail } from "@/types";

export const DEFAULT_CUSTOM_BOOKING_LABEL = "Забронировать на сайте организатора";

export const DEFAULT_CUSTOM_BOOKING_HINT =
  "Бронирование оформляется на стороннем сайте организатора — вы перейдёте по ссылке.";

export const ORGANIZER_CUSTOM_BOOKING_URL_MAX = 2000;
export const ORGANIZER_CUSTOM_BOOKING_LABEL_MAX = 80;
export const ORGANIZER_CUSTOM_BOOKING_HINT_MAX = 300;

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

export function isValidCustomBookingUrl(url: string): boolean {
  try {
    const parsed = new URL(url.trim());
    return ALLOWED_PROTOCOLS.has(parsed.protocol);
  } catch {
    return false;
  }
}

export function createDefaultCustomBookingLink(): TourCustomBookingLink {
  return normalizeCustomBookingLink({ enabled: false, url: "" });
}

export function normalizeCustomBookingLink(
  partial?: Partial<TourCustomBookingLink> | null
): TourCustomBookingLink {
  const enabled = Boolean(partial?.enabled);
  const url = partial?.url?.trim() ?? "";
  return {
    enabled,
    url: enabled ? url : url,
    label: (partial?.label?.trim() || DEFAULT_CUSTOM_BOOKING_LABEL).slice(
      0,
      ORGANIZER_CUSTOM_BOOKING_LABEL_MAX
    ),
    openInNewTab: partial?.openInNewTab ?? true,
    hint: partial?.hint?.trim().slice(0, ORGANIZER_CUSTOM_BOOKING_HINT_MAX) || undefined,
    passContext: partial?.passContext ?? false,
  };
}

export function toPublicCustomBookingLink(
  link: TourCustomBookingLink | undefined | null
): TourCustomBookingLinkPublic | undefined {
  const normalized = normalizeCustomBookingLink(link);
  if (!normalized.enabled || !normalized.url || !isValidCustomBookingUrl(normalized.url)) {
    return undefined;
  }
  return {
    url: normalized.url,
    label: normalized.label,
    openInNewTab: normalized.openInNewTab,
    hint: normalized.hint,
    passContext: normalized.passContext,
  };
}

export function tourUsesExternalBooking(
  tour: Pick<TourDetail, "customBookingLink">
): boolean {
  return Boolean(tour.customBookingLink?.url);
}

export interface ExternalBookingContext {
  guests?: number;
  selectedDateId?: string;
  dates?: TourDetail["dates"];
  customDate?: Date | null;
  /** Время слота Tripster (HH:mm), если дата из расписания партнёра */
  slotTime?: string;
}

export function buildExternalBookingUrl(
  link: TourCustomBookingLinkPublic,
  context?: ExternalBookingContext
): string {
  if (!link.passContext || !context) return link.url;

  try {
    const url = new URL(link.url);
    appendBookingContextSearchParams(url.searchParams, context);
    return url.toString();
  } catch {
    return link.url;
  }
}

function resolveExternalBookingStartDate(context: ExternalBookingContext): string | undefined {
  const selected = context.dates?.find((item) => item.id === context.selectedDateId);
  if (selected?.startDate) return selected.startDate;

  const parsedPartnerDate = context.selectedDateId
    ? parsePartnerTourDateId(context.selectedDateId)
    : null;
  if (parsedPartnerDate?.startDate) return parsedPartnerDate.startDate;

  if (context.customDate) {
    return context.customDate.toISOString().slice(0, 10);
  }

  return undefined;
}

function resolveExternalBookingSlotTime(context: ExternalBookingContext): string | undefined {
  if (context.slotTime?.trim()) return context.slotTime.trim();

  const parsedPartnerDate = context.selectedDateId
    ? parsePartnerTourDateId(context.selectedDateId)
    : null;
  return parsedPartnerDate?.time;
}

function appendBookingContextSearchParams(
  params: URLSearchParams,
  context: ExternalBookingContext
): void {
  if (context.guests && context.guests > 0) {
    params.set("guests", String(context.guests));
  }

  const selected = context.dates?.find((item) => item.id === context.selectedDateId);
  const startDate = resolveExternalBookingStartDate(context);
  if (startDate) {
    params.set("start_date", startDate);
  }

  const endDate = selected?.endDate?.trim();
  if (endDate && endDate !== startDate) {
    params.set("end_date", endDate);
  }

  const slotTime = resolveExternalBookingSlotTime(context);
  if (slotTime) {
    params.set("time", slotTime);
  }
}

export function appendExternalBookingContextToHref(
  href: string,
  link: Pick<TourCustomBookingLinkPublic, "passContext">,
  context?: ExternalBookingContext
): string {
  if (!link.passContext || !context) return href;

  const params = new URLSearchParams();
  appendBookingContextSearchParams(params, context);
  if ([...params.keys()].length === 0) return href;

  const separator = href.includes("?") ? "&" : "?";
  return `${href}${separator}${params.toString()}`;
}

export function resolveTourExternalBookingHref(
  tour: Pick<TourDetail, "customBookingLink" | "dates">,
  context?: ExternalBookingContext
): string | null {
  const link = tour.customBookingLink;
  const url = link?.url?.trim();
  if (!url || !link) return null;

  const contextPayload = {
    ...context,
    dates: context?.dates?.length ? context.dates : tour.dates,
  };

  if (url.startsWith("/")) {
    return appendExternalBookingContextToHref(url, link, contextPayload);
  }

  const publicLink = toPublicCustomBookingLink(link as TourCustomBookingLink | undefined);
  if (!publicLink) return null;
  return buildExternalBookingUrl(publicLink, contextPayload);
}
