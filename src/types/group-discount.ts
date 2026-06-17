/** Способ расчёта групповой скидки для диапазона туристов. */
export type GroupDiscountType = "percent" | "fixed_per_person";

export interface GroupDiscountTier {
  id: string;
  /** Минимальное число туристов в брони (включительно), обычно от 2. */
  minGuests: number;
  /** Максимальное число туристов (включительно). Пусто — без верхней границы. */
  maxGuests?: number | null;
  discountType: GroupDiscountType;
  /** Процент скидки (0–100) или фиксированная цена за человека в USD. */
  value: number;
}

export interface GroupDiscountSettings {
  enabled: boolean;
  tiers: GroupDiscountTier[];
}

export const EMPTY_GROUP_DISCOUNT: GroupDiscountSettings = {
  enabled: false,
  tiers: [],
};
