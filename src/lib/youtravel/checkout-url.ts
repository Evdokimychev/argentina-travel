export type YouTravelBookingApiResponse = {
  ok?: boolean;
  mode?: string;
  orderId?: string | number | null;
  orderUrl?: string | null;
  fallbackUrl?: string | null;
};

function toPositiveOrderId(raw: string | number | null | undefined): string | null {
  if (raw == null) return null;
  const value = String(raw).trim();
  if (!value) return null;
  if (!/^\d+$/.test(value)) return null;
  return value;
}

function isUsableHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/** YouTravel checkout page for created order where customer can finish booking. */
export function buildYouTravelCheckoutUrl(tourId: number, orderId: string | number): string {
  const normalizedOrderId = String(orderId).trim();
  return `https://youtravel.me/checkout/${tourId}?orderId=${encodeURIComponent(normalizedOrderId)}`;
}

/**
 * Picks redirect target after YouTravel booking request:
 * successful order -> checkout/{tourId}?orderId=...
 * fallback or invalid payload -> server/client fallback URL.
 */
export function resolveYouTravelBookingRedirectFromApi(input: {
  response: YouTravelBookingApiResponse;
  tourId: number;
  fallbackUrl: string;
}): string {
  const { response, tourId, fallbackUrl } = input;

  if (response.mode === "affiliate_fallback" || !response.ok) {
    const serverFallback = response.fallbackUrl?.trim();
    return serverFallback && isUsableHttpUrl(serverFallback) ? serverFallback : fallbackUrl;
  }

  const orderId = toPositiveOrderId(response.orderId);
  if (tourId > 0 && orderId) {
    return buildYouTravelCheckoutUrl(tourId, orderId);
  }

  const directOrderUrl = response.orderUrl?.trim();
  if (directOrderUrl && isUsableHttpUrl(directOrderUrl)) {
    return directOrderUrl;
  }

  return fallbackUrl;
}
