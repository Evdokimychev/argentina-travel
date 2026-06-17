import type { TourDetail } from "@/types";
import {
  CHECKOUT_ROOM_OPTIONS,
  type RoomOption,
} from "@/components/tour-detail/checkout/types";
import { resolveCheckoutRoomOptionsFromAccommodations } from "@/lib/tour-accommodation-public";

export function resolveTourCheckoutRoomOptions(tour: Pick<TourDetail, "accommodations" | "accommodationUpgradesEnabled">): RoomOption[] {
  const fromTour = resolveCheckoutRoomOptionsFromAccommodations(
    tour.accommodations,
    tour.accommodationUpgradesEnabled !== false
  );

  if (fromTour.length) {
    return fromTour.map((room) => ({
      id: room.id,
      title: room.title,
      description: room.description,
      priceUsdPerTraveler: room.priceUsdPerTraveler,
      capacity: room.capacity,
    }));
  }

  return CHECKOUT_ROOM_OPTIONS;
}

export function tourCheckoutHasRoomSelection(
  tour: Pick<TourDetail, "accommodations" | "accommodationUpgradesEnabled">
): boolean {
  if (tour.accommodationUpgradesEnabled === false) return false;
  return resolveTourCheckoutRoomOptions(tour).length > 0;
}
