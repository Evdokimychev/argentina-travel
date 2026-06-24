import type { YouTravelOffer } from "@/lib/youtravel/types";

function parsePositiveInt(value: unknown): number | undefined {
  if (value == null) return undefined;
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export function resolveTravelersGoingFromOffer(offer: YouTravelOffer): number | undefined {
  const explicit =
    parsePositiveInt(offer.booked_spaces) ??
    parsePositiveInt(offer.bookedSpaces) ??
    parsePositiveInt(offer.booked_count) ??
    parsePositiveInt(offer.bookedCount) ??
    parsePositiveInt(offer.travelers_count) ??
    parsePositiveInt(offer.travelersCount) ??
    parsePositiveInt(offer.participants_count);

  if (explicit != null) return explicit;

  const total =
    parsePositiveInt(offer.seatsTotal) ??
    parsePositiveInt(offer.max_group_size) ??
    parsePositiveInt(offer.group_size);
  const free =
    parsePositiveInt(offer.freeSpaces) ??
    parsePositiveInt(offer.seatsAvailable) ??
    parsePositiveInt(offer.placesLeft);

  if (total != null && free != null && total > free) return total - free;
  return undefined;
}

export function resolveOfferSeatsTotal(offer: YouTravelOffer): number | undefined {
  const raw =
    offer.seatsTotal ?? offer.max_group_size ?? offer.group_size ?? offer.groupSize;
  if (raw == null) return undefined;
  const parsed = typeof raw === "number" ? raw : Number.parseInt(String(raw), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export function resolveOfferFreeSpaces(offer: YouTravelOffer): number {
  const raw = offer.freeSpaces ?? offer.seatsAvailable ?? offer.placesLeft;
  if (raw != null) {
    const parsed = typeof raw === "number" ? raw : Number.parseInt(String(raw), 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  }
  return resolveOfferSeatsTotal(offer) ?? 0;
}
