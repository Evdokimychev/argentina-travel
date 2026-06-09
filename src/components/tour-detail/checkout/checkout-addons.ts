export interface TransferVehicleOption {
  id: string;
  title: string;
  description: string;
  image: string;
  /** Максимум пассажиров в одной машине */
  capacity: number;
  /** Цена за одну машину, USD */
  priceUsd: number;
}

export const TRANSFER_VEHICLE_OPTIONS: TransferVehicleOption[] = [
  {
    id: "sedan",
    title: "Легковой автомобиль",
    description: "Комфортный седан или универсал с багажом.",
    image:
      "https://images.unsplash.com/photo-1549397661-22abc752106a?w=240&h=160&fit=crop&crop=entropy&auto=format&q=80",
    capacity: 3,
    priceUsd: 45,
  },
  {
    id: "minivan",
    title: "Минивэн",
    description: "Подходит для семьи или небольшой группы с чемоданами.",
    image:
      "https://images.unsplash.com/photo-1519641471654-76cefc7a104f?w=240&h=160&fit=crop&crop=entropy&auto=format&q=80",
    capacity: 7,
    priceUsd: 65,
  },
  {
    id: "van",
    title: "Микроавтобус",
    description: "Просторный транспорт для средних групп.",
    image:
      "https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=240&h=160&fit=crop&crop=entropy&auto=format&q=80",
    capacity: 12,
    priceUsd: 95,
  },
  {
    id: "bus",
    title: "Автобус",
    description: "Для больших групп и корпоративных заездов.",
    image:
      "https://images.unsplash.com/photo-1570125909232-e93365328168?w=240&h=160&fit=crop&crop=entropy&auto=format&q=80",
    capacity: 20,
    priceUsd: 140,
  },
];

export interface CheckoutAddon {
  id: string;
  title: string;
  description: string;
  priceUsd: number;
}

export interface PerTravelerAddon {
  id: "insurance";
  title: string;
  description: string;
  priceUsdPerTraveler: number;
}

export const INSURANCE_ADDON: PerTravelerAddon = {
  id: "insurance",
  title: "Страховка путешественника",
  description: "Медицинское страхование на весь период поездки.",
  priceUsdPerTraveler: 35,
};

/** Дополнения с фиксированной ценой на группу (не трансфер, не страховка) */
export const CHECKOUT_ADDONS: CheckoutAddon[] = [
  {
    id: "private",
    title: "Приватный формат",
    description: "Только ваша группа без других участников.",
    priceUsd: 120,
  },
];

export function calcInsuranceTotal(travelers: number): number {
  if (travelers <= 0) return 0;
  return travelers * INSURANCE_ADDON.priceUsdPerTraveler;
}

export function minTransferVehiclePriceUsd(): number {
  return Math.min(...TRANSFER_VEHICLE_OPTIONS.map((vehicle) => vehicle.priceUsd));
}

export function getTransferVehicle(id: string): TransferVehicleOption | undefined {
  return TRANSFER_VEHICLE_OPTIONS.find((v) => v.id === id);
}

export function transferVehicleCount(guests: number, capacity: number): number {
  if (guests <= 0 || capacity <= 0) return 0;
  return Math.ceil(guests / capacity);
}

export function calcTransferTotal(vehicleId: string, guests: number): number {
  const vehicle = getTransferVehicle(vehicleId);
  if (!vehicle) return 0;
  return transferVehicleCount(guests, vehicle.capacity) * vehicle.priceUsd;
}

/** Самый компактный вариант, куда группа помещается в одну машину */
export function recommendTransferVehicle(guests: number): string {
  const fitsOne = TRANSFER_VEHICLE_OPTIONS.find((v) => v.capacity >= guests);
  if (fitsOne) return fitsOne.id;
  return TRANSFER_VEHICLE_OPTIONS[TRANSFER_VEHICLE_OPTIONS.length - 1].id;
}

export function simpleAddonsTotal(addonIds: string[]): number {
  return CHECKOUT_ADDONS.filter((a) => addonIds.includes(a.id)).reduce(
    (sum, a) => sum + a.priceUsd,
    0
  );
}
