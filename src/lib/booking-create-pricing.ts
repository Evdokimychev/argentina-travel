import { CHECKOUT_ADDONS, TRANSFER_VEHICLE_OPTIONS } from "@/components/tour-detail/checkout/checkout-addons";
import {
  calcRoomTotalUsd,
  createDefaultRoomAllocations,
  validateRoomAllocations,
} from "@/components/tour-detail/checkout/checkout-accommodation";
import {
  calcTransferTotalFromAllocations,
  validateTransferAllocations,
  type TransferAllocations,
} from "@/components/tour-detail/checkout/checkout-transfer";
import type { RoomOption } from "@/components/tour-detail/checkout/types";
import { resolveGroupDiscountQuote } from "@/lib/group-discount";
import type { CreateBookingCommand } from "@/lib/booking-create-command";
import type { GroupDiscountSettings } from "@/types/group-discount";

export interface BookingPriceSnapshot {
  currency: "USD";
  source: "canonical_tour";
  basePricePerTravelerUsd: number;
  pricePerTravelerUsd: number;
  travelers: number;
  baseTotalUsd: number;
  accommodationTotalUsd: number;
  addonsTotalUsd: number;
  transferTotalUsd: number;
  totalUsd: number;
  groupDiscountTierId?: string;
  calculatedAt: string;
}

type PriceInput = {
  basePricePerTravelerUsd: number;
  travelers: number;
  groupDiscount?: GroupDiscountSettings;
  roomOptions: RoomOption[];
  selections?: CreateBookingCommand["selections"];
  calculatedAt?: string;
};

function asSafeAllocationMap(value: Record<string, number> | undefined): Record<string, number> {
  return Object.fromEntries(
    Object.entries(value ?? {}).map(([key, count]) => [key, Math.max(0, Math.floor(Number(count)))])
  );
}

export function calculateCanonicalBookingPrice(input: PriceInput): BookingPriceSnapshot {
  const basePrice = Number(input.basePricePerTravelerUsd);
  if (!Number.isFinite(basePrice) || basePrice < 0) {
    throw new Error("Для тура не настроена корректная цена.");
  }
  if (!Number.isInteger(input.travelers) || input.travelers < 1) {
    throw new Error("Укажите корректное количество туристов.");
  }

  const quote = resolveGroupDiscountQuote(basePrice, input.travelers, input.groupDiscount);
  const roomAllocations = input.selections?.roomAllocations
    ? asSafeAllocationMap(input.selections.roomAllocations)
    : createDefaultRoomAllocations(input.travelers, input.roomOptions);
  if (input.roomOptions.length > 0) {
    const unknownRoom = Object.keys(roomAllocations).find(
      (id) => !input.roomOptions.some((room) => room.id === id)
    );
    if (unknownRoom) throw new Error("Выбран недоступный вариант проживания.");
    const roomError = validateRoomAllocations(roomAllocations, input.travelers, input.roomOptions);
    if (roomError) throw new Error(roomError);
  }

  const addonIds = Array.from(new Set(input.selections?.addonIds ?? []));
  const unknownAddon = addonIds.find((id) => !CHECKOUT_ADDONS.some((addon) => addon.id === id));
  if (unknownAddon) throw new Error("Выбрано недоступное дополнение.");

  const transferAllocations = asSafeAllocationMap(
    input.selections?.transferAllocations
  ) as TransferAllocations;
  const unknownTransfer = Object.keys(transferAllocations).find(
    (id) => !TRANSFER_VEHICLE_OPTIONS.some((vehicle) => vehicle.id === id)
  );
  if (unknownTransfer) throw new Error("Выбран недоступный вариант трансфера.");
  const transferError = validateTransferAllocations(transferAllocations, input.travelers);
  if (transferError) throw new Error(transferError);

  const accommodationTotalUsd = calcRoomTotalUsd(roomAllocations, input.roomOptions);
  const addonsTotalUsd = CHECKOUT_ADDONS.filter((addon) => addonIds.includes(addon.id)).reduce(
    (sum, addon) => sum + addon.priceUsd,
    0
  );
  const transferTotalUsd = calcTransferTotalFromAllocations(transferAllocations);
  const baseTotalUsd = quote.pricePerPersonUsd * input.travelers;
  const totalUsd = Math.round(
    (baseTotalUsd + accommodationTotalUsd + addonsTotalUsd + transferTotalUsd) * 100
  ) / 100;

  return {
    currency: "USD",
    source: "canonical_tour",
    basePricePerTravelerUsd: basePrice,
    pricePerTravelerUsd: quote.pricePerPersonUsd,
    travelers: input.travelers,
    baseTotalUsd,
    accommodationTotalUsd,
    addonsTotalUsd,
    transferTotalUsd,
    totalUsd,
    groupDiscountTierId: quote.appliedTier?.id,
    calculatedAt: input.calculatedAt ?? new Date().toISOString(),
  };
}
