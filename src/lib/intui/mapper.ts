import type { TransferOffer } from "@/lib/intui/types";

const FEATURE_KEYS = [
  "wifi",
  "air_conditioning",
  "airconditioning",
  "meet_and_greet",
  "meetandgreet",
  "child_seat",
  "childseat",
  "water",
  "ski",
] as const;

function readNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function readString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return undefined;
}

export function extractIntuiOfferArray(payload: unknown): Record<string, unknown>[] {
  if (!payload) return [];
  if (Array.isArray(payload)) {
    return payload.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"));
  }
  if (typeof payload !== "object") return [];

  const obj = payload as Record<string, unknown>;

  if (obj.status === "ok" || obj.status === "success") {
    const nested = extractIntuiOfferArray(obj.data ?? obj.result ?? obj.response);
    if (nested.length) return nested;
  }

  for (const key of [
    "data",
    "cars",
    "car",
    "offers",
    "result",
    "vehicles",
    "transfers",
    "availCars",
    "AvailCars",
  ]) {
    const value = obj[key];
    if (Array.isArray(value)) {
      return value.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"));
    }
    if (value && typeof value === "object") {
      const nested = extractIntuiOfferArray(value);
      if (nested.length) return nested;
    }
  }

  return [];
}

function collectFeatures(raw: Record<string, unknown>): string[] {
  const features: string[] = [];
  const services = raw.services ?? raw.features ?? raw.options ?? raw.amenities;
  if (Array.isArray(services)) {
    for (const item of services) {
      if (typeof item === "string" && item.trim()) {
        features.push(item.trim());
        continue;
      }
      if (item && typeof item === "object") {
        const label =
          readString((item as Record<string, unknown>).name) ??
          readString((item as Record<string, unknown>).title);
        if (label) features.push(label);
      }
    }
  }

  for (const key of FEATURE_KEYS) {
    if (raw[key] === true || raw[key] === 1 || raw[key] === "1") {
      features.push(key.replace(/_/g, " "));
    }
  }

  return features;
}

function resolvePrice(raw: Record<string, unknown>): { price?: number; currency?: string } {
  const priceObj = raw.price;
  if (priceObj && typeof priceObj === "object") {
    const nested = priceObj as Record<string, unknown>;
    return {
      price:
        readNumber(nested.total) ??
        readNumber(nested.amount) ??
        readNumber(nested.value) ??
        readNumber(nested.price),
      currency:
        readString(nested.currency) ??
        readString(nested.currency_code) ??
        readString(nested.curr),
    };
  }

  return {
    price:
      readNumber(raw.price) ??
      readNumber(raw.total_price) ??
      readNumber(raw.totalPrice) ??
      readNumber(raw.amount) ??
      readNumber(raw.cost) ??
      readNumber(raw.net_price) ??
      readNumber(raw.netPrice),
    currency:
      readString(raw.currency) ??
      readString(raw.currency_code) ??
      readString(raw.curr),
  };
}

function resolveVehicleName(raw: Record<string, unknown>): string | undefined {
  const brand = readString(raw.car_brand) ?? readString(raw.brand);
  const model = readString(raw.car_model) ?? readString(raw.model);
  if (brand && model) return `${brand} ${model}`;

  return (
    readString(raw.vehicle_name) ??
    readString(raw.vehicleName) ??
    readString(raw.car_name) ??
    readString(raw.carName) ??
    readString(raw.name) ??
    readString(raw.title)
  );
}

function resolveImageUrl(raw: Record<string, unknown>): string | undefined {
  return (
    readString(raw.car_photo) ??
    readString(raw.carPhoto) ??
    readString(raw.photo) ??
    readString(raw.image) ??
    readString(raw.image_url) ??
    readString(raw.imageUrl)
  );
}

function resolveBookPath(raw: Record<string, unknown>): string | undefined {
  return (
    readString(raw.book_url) ??
    readString(raw.bookUrl) ??
    readString(raw.booking_url) ??
    readString(raw.url) ??
    readString(raw.link) ??
    readString(raw.landing_url) ??
    (raw.booking_id != null ? `transfer/book/?id=${readString(raw.booking_id)}` : undefined) ??
    (raw.id != null ? `transfer/book/?id=${readString(raw.id)}` : undefined)
  );
}

export function mapIntuiTransferOffer(raw: Record<string, unknown>, index: number): TransferOffer | null {
  const { price, currency: nestedCurrency } = resolvePrice(raw);
  if (price == null) return null;

  const vehicleName = resolveVehicleName(raw) ?? `Transfer ${index + 1}`;
  const id =
    readString(raw.id) ??
    readString(raw.car_id) ??
    readString(raw.offer_id) ??
    readString(raw.transfer_id) ??
    `${vehicleName}-${price}-${index}`;

  const currency = nestedCurrency ?? readString(raw.currency) ?? readString(raw.currency_code) ?? "USD";

  return {
    id,
    vehicleName,
    vehicleClass:
      readString(raw.class) ??
      readString(raw.vehicle_class) ??
      readString(raw.vehicleClass) ??
      readString(raw.category) ??
      readString(raw.car_class),
    price,
    currency,
    capacity:
      readNumber(raw.capacity) ??
      readNumber(raw.passengers) ??
      readNumber(raw.max_passengers) ??
      readNumber(raw.pax) ??
      readNumber(raw.seats),
    luggage:
      readNumber(raw.luggage) ??
      readNumber(raw.bags) ??
      readNumber(raw.suitcases) ??
      readNumber(raw.baggage),
    durationMinutes:
      readNumber(raw.duration) ??
      readNumber(raw.duration_minutes) ??
      readNumber(raw.travel_time) ??
      readNumber(raw.travelTime),
    features: collectFeatures(raw),
    imageUrl: resolveImageUrl(raw),
    bookPath: resolveBookPath(raw),
    raw,
  };
}

export function mapIntuiTransferOffers(payload: unknown): TransferOffer[] {
  return extractIntuiOfferArray(payload)
    .map((item, index) => mapIntuiTransferOffer(item, index))
    .filter((item): item is TransferOffer => item != null);
}
