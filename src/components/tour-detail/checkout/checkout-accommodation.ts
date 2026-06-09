import { CHECKOUT_ROOM_OPTIONS, type RoomAllocations, type RoomOption, type RoomOptionId } from "./types";
import { formatWithWord, formatTourists } from "@/lib/pluralize";

export type { RoomAllocations } from "./types";

export const DEFAULT_INCLUDED_ROOM_ID: RoomOptionId = "double";

const ROOM_COUNT_LABELS: Record<
  RoomOptionId,
  { one: string; few: string; many: string }
> = {
  single: { one: "одноместный номер", few: "одноместных номера", many: "одноместных номеров" },
  twin: { one: "номер с двумя кроватями", few: "номера с двумя кроватями", many: "номеров с двумя кроватями" },
  double: { one: "двухместный номер", few: "двухместных номера", many: "двухместных номеров" },
  triple: { one: "трёхместный номер", few: "трёхместных номера", many: "трёхместных номеров" },
  upgrade4: { one: "номер 4★", few: "номера 4★", many: "номеров 4★" },
  upgrade5: { one: "номер 5★", few: "номера 5★", many: "номеров 5★" },
};

export function calcRoomsNeeded(travelers: number, room: Pick<RoomOption, "capacity">): number {
  if (travelers <= 0) return 0;
  return Math.ceil(travelers / room.capacity);
}

export function formatRoomCount(count: number, roomId: RoomOptionId): string {
  const labels = ROOM_COUNT_LABELS[roomId];
  return formatWithWord(count, labels.one, labels.few, labels.many);
}

export function formatRoomAllocationLine(
  room: RoomOption,
  travelers: number
): string {
  const rooms = calcRoomsNeeded(travelers, room);
  return formatRoomCount(rooms, room.id);
}

export function isDefaultRoomAllocation(
  allocations: RoomAllocations,
  guests: number
): boolean {
  return (
    allocations[DEFAULT_INCLUDED_ROOM_ID] === guests &&
    CHECKOUT_ROOM_OPTIONS.every(
      (room) => room.id === DEFAULT_INCLUDED_ROOM_ID || allocations[room.id] === 0
    )
  );
}

export function createDefaultRoomAllocations(guests: number): RoomAllocations {
  return {
    single: 0,
    twin: 0,
    double: guests,
    triple: 0,
    upgrade4: 0,
    upgrade5: 0,
  };
}

export function totalRoomAllocated(allocations: RoomAllocations): number {
  return CHECKOUT_ROOM_OPTIONS.reduce((sum, room) => sum + (allocations[room.id] ?? 0), 0);
}

export function calcRoomTotalUsd(allocations: RoomAllocations): number {
  return CHECKOUT_ROOM_OPTIONS.reduce((sum, room) => {
    const count = allocations[room.id] ?? 0;
    return sum + count * room.priceUsdPerTraveler;
  }, 0);
}

export function getRoomAllocationStatus(
  allocations: RoomAllocations,
  guests: number
): "complete" | "under" | "over" {
  const total = totalRoomAllocated(allocations);
  if (total > guests) return "over";
  if (total < guests) return "under";
  return "complete";
}

export function roomAllocationWarning(
  allocations: RoomAllocations,
  guests: number
): string | null {
  const total = totalRoomAllocated(allocations);
  if (total > guests) {
    return `Назначено ${formatTourists(total)}, а в группе ${formatTourists(guests)}. Уменьшите количество в одном из полей.`;
  }
  if (total > 0 && total < guests) {
    return `Осталось распределить ${formatTourists(guests - total)}.`;
  }
  if (total === 0) {
    return "Распределите туристов по типам размещения.";
  }
  return null;
}

export function validateRoomAllocations(
  allocations: RoomAllocations,
  guests: number
): string | null {
  const total = totalRoomAllocated(allocations);
  if (total === 0) {
    return "Распределите туристов по типам размещения";
  }
  if (total < guests) {
    return `Назначено ${total} из ${guests}. Выберите тип номера для оставшихся туристов.`;
  }
  if (total > guests) {
    return `Назначено ${total} туристов, а в группе ${guests}. Уменьшите количество в одном из полей.`;
  }
  return null;
}

export function setRoomAllocation(
  allocations: RoomAllocations,
  roomId: RoomOptionId,
  count: number
): RoomAllocations {
  return { ...allocations, [roomId]: Math.max(0, count) };
}
