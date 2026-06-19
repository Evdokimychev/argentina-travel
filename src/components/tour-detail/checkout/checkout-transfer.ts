import {
  TRANSFER_VEHICLE_OPTIONS,
  recommendTransferVehicle,
  simpleAddonsTotal,
  transferVehicleCount,
  type TransferVehicleOption,
} from "./checkout-addons";
import { formatTourists, formatWithWord } from "@/lib/pluralize";

export type TransferVehicleId = (typeof TRANSFER_VEHICLE_OPTIONS)[number]["id"];

export type TransferAllocations = Record<TransferVehicleId, number>;

export const EMPTY_TRANSFER_ALLOCATIONS: TransferAllocations = {
  sedan: 0,
  minivan: 0,
  van: 0,
  bus: 0,
};

export function createDefaultTransferAllocations(guests: number): TransferAllocations {
  const vehicleId = recommendTransferVehicle(guests) as TransferVehicleId;
  return { ...EMPTY_TRANSFER_ALLOCATIONS, [vehicleId]: guests };
}

export function isTransferEnabled(allocations: TransferAllocations): boolean {
  return totalTransferAllocated(allocations) > 0;
}

export function isDefaultTransferAllocation(
  allocations: TransferAllocations,
  guests: number
): boolean {
  const vehicleId = recommendTransferVehicle(guests) as TransferVehicleId;
  return (
    allocations[vehicleId] === guests &&
    TRANSFER_VEHICLE_OPTIONS.every(
      (vehicle) => vehicle.id === vehicleId || allocations[vehicle.id as TransferVehicleId] === 0
    )
  );
}

export function totalTransferAllocated(allocations: TransferAllocations): number {
  return TRANSFER_VEHICLE_OPTIONS.reduce(
    (sum, vehicle) => sum + (allocations[vehicle.id as TransferVehicleId] ?? 0),
    0
  );
}

export function calcTransferLineTotal(
  passengers: number,
  vehicle: Pick<TransferVehicleOption, "capacity" | "priceUsd">
): number {
  if (passengers <= 0) return 0;
  return transferVehicleCount(passengers, vehicle.capacity) * vehicle.priceUsd;
}

export function calcTransferTotalFromAllocations(allocations: TransferAllocations): number {
  return TRANSFER_VEHICLE_OPTIONS.reduce((sum, vehicle) => {
    const passengers = allocations[vehicle.id as TransferVehicleId] ?? 0;
    return sum + calcTransferLineTotal(passengers, vehicle);
  }, 0);
}

export function formatVehicleCount(count: number): string {
  return formatWithWord(count, "машина", "машины", "машин");
}

export function formatTransferAllocationLine(
  vehicle: TransferVehicleOption,
  passengers: number
): string {
  const vehicles = transferVehicleCount(passengers, vehicle.capacity);
  return formatVehicleCount(vehicles);
}

export function setTransferAllocation(
  allocations: TransferAllocations,
  vehicleId: TransferVehicleId,
  passengers: number
): TransferAllocations {
  return { ...allocations, [vehicleId]: Math.max(0, passengers) };
}

export function getTransferAllocationStatus(
  allocations: TransferAllocations,
  guests: number
): "idle" | "complete" | "under" | "over" {
  const total = totalTransferAllocated(allocations);
  if (total === 0) return "idle";
  if (total > guests) return "over";
  if (total < guests) return "under";
  return "complete";
}

export function transferAllocationWarning(
  allocations: TransferAllocations,
  guests: number
): string | null {
  const total = totalTransferAllocated(allocations);
  if (total === 0) return null;
  if (total > guests) {
    return `Назначено ${formatTourists(total)}, а в группе ${formatTourists(guests)}. Уменьшите количество в одном из полей.`;
  }
  if (total < guests) {
    return `Осталось распределить ${formatTourists(guests - total)} по типам транспорта.`;
  }
  return null;
}

export function validateTransferAllocations(
  allocations: TransferAllocations,
  guests: number
): string | null {
  const status = getTransferAllocationStatus(allocations, guests);
  if (status === "idle") return null;
  return transferAllocationWarning(allocations, guests);
}

export function checkoutAddonsTotal(
  addonIds: string[],
  transferAllocations: TransferAllocations
): number {
  return simpleAddonsTotal(addonIds) + calcTransferTotalFromAllocations(transferAllocations);
}
