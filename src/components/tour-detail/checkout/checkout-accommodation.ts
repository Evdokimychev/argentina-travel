import { CHECKOUT_ROOM_OPTIONS, type RoomAllocations, type RoomOption } from "./types";
import { formatWithWord, formatTourists } from "@/lib/pluralize";

export type { RoomAllocations } from "./types";

export const DEFAULT_INCLUDED_ROOM_ID = "double";

const ROOM_COUNT_LABELS: Record<string, { one: string; few: string; many: string }> = {
  single: { one: "одноместный номер", few: "одноместных номера", many: "одноместных номеров" },
  twin: {
    one: "номер с двумя кроватями",
    few: "номера с двумя кроватями",
    many: "номеров с двумя кроватями",
  },
  double: { one: "двухместный номер", few: "двухместных номера", many: "двухместных номеров" },
  triple: { one: "трёхместный номер", few: "трёхместных номера", many: "трёхместных номеров" },
  upgrade4: { one: "номер 4★", few: "номера 4★", many: "номеров 4★" },
  upgrade5: { one: "номер 5★", few: "номера 5★", many: "номеров 5★" },
};

export function resolveDefaultIncludedRoomId(roomOptions: RoomOption[]): string {
  const included = roomOptions.find((room) => room.priceUsdPerTraveler === 0);
  return included?.id ?? roomOptions[0]?.id ?? DEFAULT_INCLUDED_ROOM_ID;
}

export function calcRoomsNeeded(travelers: number, room: Pick<RoomOption, "capacity">): number {
  if (travelers <= 0) return 0;
  return Math.ceil(travelers / room.capacity);
}

export function formatRoomCount(count: number, roomId: string, roomTitle?: string): string {
  const labels = ROOM_COUNT_LABELS[roomId];
  if (labels) return formatWithWord(count, labels.one, labels.few, labels.many);
  const fallback = roomTitle?.toLowerCase() ?? "номер";
  return formatWithWord(count, fallback, fallback, fallback);
}

export function formatRoomAllocationLine(room: RoomOption, travelers: number): string {
  const rooms = calcRoomsNeeded(travelers, room);
  return formatRoomCount(rooms, room.id, room.title);
}

export function isDefaultRoomAllocation(
  allocations: RoomAllocations,
  guests: number,
  roomOptions: RoomOption[] = CHECKOUT_ROOM_OPTIONS
): boolean {
  const defaultRoomId = resolveDefaultIncludedRoomId(roomOptions);
  return roomOptions.every(
    (room) =>
      room.id === defaultRoomId
        ? allocations[room.id] === guests
        : (allocations[room.id] ?? 0) === 0
  );
}

export function createDefaultRoomAllocations(
  guests: number,
  roomOptions: RoomOption[] = CHECKOUT_ROOM_OPTIONS
): RoomAllocations {
  const defaultRoomId = resolveDefaultIncludedRoomId(roomOptions);
  const allocations = Object.fromEntries(roomOptions.map((room) => [room.id, 0]));
  allocations[defaultRoomId] = guests;
  return allocations;
}

export function totalRoomAllocated(
  allocations: RoomAllocations,
  roomOptions: RoomOption[] = CHECKOUT_ROOM_OPTIONS
): number {
  return roomOptions.reduce((sum, room) => sum + (allocations[room.id] ?? 0), 0);
}

export function calcRoomTotalUsd(
  allocations: RoomAllocations,
  roomOptions: RoomOption[] = CHECKOUT_ROOM_OPTIONS
): number {
  return roomOptions.reduce((sum, room) => {
    const count = allocations[room.id] ?? 0;
    return sum + count * room.priceUsdPerTraveler;
  }, 0);
}

export function getRoomAllocationStatus(
  allocations: RoomAllocations,
  guests: number,
  roomOptions: RoomOption[] = CHECKOUT_ROOM_OPTIONS
): "complete" | "under" | "over" {
  const total = totalRoomAllocated(allocations, roomOptions);
  if (total > guests) return "over";
  if (total < guests) return "under";
  return "complete";
}

export function roomAllocationWarning(
  allocations: RoomAllocations,
  guests: number,
  roomOptions: RoomOption[] = CHECKOUT_ROOM_OPTIONS
): string | null {
  const total = totalRoomAllocated(allocations, roomOptions);
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
  guests: number,
  roomOptions: RoomOption[] = CHECKOUT_ROOM_OPTIONS
): string | null {
  const total = totalRoomAllocated(allocations, roomOptions);
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
  roomId: string,
  count: number
): RoomAllocations {
  return { ...allocations, [roomId]: Math.max(0, count) };
}
