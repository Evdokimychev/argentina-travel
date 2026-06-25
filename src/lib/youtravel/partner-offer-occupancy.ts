import type { YouTravelOffer } from "@/lib/youtravel/types";

function parsePositiveInt(value: unknown): number | undefined {
  if (value == null) return undefined;
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function parseNonNegativeInt(value: unknown): number | undefined {
  if (value == null) return undefined;
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function readOfferFreeSpacesRaw(offer: YouTravelOffer): number | undefined {
  const raw = offer.freeSpaces ?? offer.seatsAvailable ?? offer.placesLeft;
  return parseNonNegativeInt(raw);
}

function readDedicatedBookedCount(offer: YouTravelOffer): number | undefined {
  return (
    parsePositiveInt(offer.booked_spaces) ??
    parsePositiveInt(offer.bookedSpaces) ??
    parsePositiveInt(offer.booked_count) ??
    parsePositiveInt(offer.bookedCount)
  );
}

export function resolveTravelersGoingFromOffer(offer: YouTravelOffer): number | undefined {
  const total = resolveOfferSeatsTotal(offer);
  const free = readOfferFreeSpacesRaw(offer);

  // Free seats from the partner API are authoritative when total is known.
  if (total != null && free != null) {
    if (free >= total) return 0;
    return total - free;
  }

  return readDedicatedBookedCount(offer);
}

export function resolveOfferSeatsTotal(offer: YouTravelOffer): number | undefined {
  const raw =
    offer.seatsTotal ?? offer.max_group_size ?? offer.group_size ?? offer.groupSize;
  if (raw == null) return undefined;
  const parsed = typeof raw === "number" ? raw : Number.parseInt(String(raw), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export function resolveOfferFreeSpaces(offer: YouTravelOffer): number {
  const free = readOfferFreeSpacesRaw(offer);
  if (free != null) return free;

  const total = resolveOfferSeatsTotal(offer);
  const booked = readDedicatedBookedCount(offer);
  if (total != null && booked != null) {
    return Math.max(0, total - booked);
  }

  return 0;
}
