import { formatPeople, peopleWord } from "@/lib/pluralize";
import type {
  GroupDiscountSettings,
  GroupDiscountTier,
  GroupDiscountType,
} from "@/types/group-discount";
import { EMPTY_GROUP_DISCOUNT } from "@/types/group-discount";
import type { Tour } from "@/types/tour";

export interface GroupDiscountQuote {
  pricePerPersonUsd: number;
  basePriceUsd: number;
  savingsPerPersonUsd: number;
  appliedTier?: GroupDiscountTier;
}

function tierEffectivePrice(basePriceUsd: number, tier: GroupDiscountTier): number {
  if (tier.discountType === "percent") {
    const pct = Math.min(100, Math.max(0, tier.value));
    return Math.max(0, basePriceUsd * (1 - pct / 100));
  }
  return Math.max(0, tier.value);
}

function tierMatchesGuestCount(tier: GroupDiscountTier, guestCount: number): boolean {
  if (guestCount < tier.minGuests) return false;
  if (tier.maxGuests != null && guestCount > tier.maxGuests) return false;
  return true;
}

/** Партнёрские экскурсии (Tripster, Sputnik8) живут в отдельном каталоге — скидки платформы к ним не применяются. */
export function tourSupportsGroupDiscount(
  tour: Pick<Tour, "type"> & { partnerAffiliate?: boolean }
): boolean {
  if (tour.partnerAffiliate) return false;
  return true;
}

export function normalizeGroupDiscountSettings(
  input?: GroupDiscountSettings | null
): GroupDiscountSettings {
  if (!input) return { ...EMPTY_GROUP_DISCOUNT };

  const tiers = (input.tiers ?? [])
    .map((tier) => ({
      id: tier.id || crypto.randomUUID(),
      minGuests: Math.max(2, Math.floor(tier.minGuests || 2)),
      maxGuests:
        tier.maxGuests == null || tier.maxGuests === 0
          ? null
          : Math.max(tier.minGuests, Math.floor(tier.maxGuests)),
      discountType: (tier.discountType === "fixed_per_person"
        ? "fixed_per_person"
        : "percent") as GroupDiscountType,
      value: Math.max(0, Number(tier.value) || 0),
    }))
    .filter((tier) => tier.value > 0 && (tier.discountType !== "percent" || tier.value <= 100))
    .sort((a, b) => a.minGuests - b.minGuests);

  return {
    enabled: Boolean(input.enabled) && tiers.length > 0,
    tiers,
  };
}

export function resolveGroupDiscountQuote(
  basePriceUsd: number,
  guestCount: number,
  settings?: GroupDiscountSettings | null
): GroupDiscountQuote {
  const normalized = normalizeGroupDiscountSettings(settings);
  const base = Math.max(0, basePriceUsd);

  if (!normalized.enabled || guestCount < 2) {
    return {
      pricePerPersonUsd: base,
      basePriceUsd: base,
      savingsPerPersonUsd: 0,
    };
  }

  let bestPrice = base;
  let appliedTier: GroupDiscountTier | undefined;

  for (const tier of normalized.tiers) {
    if (!tierMatchesGuestCount(tier, guestCount)) continue;
    const tierPrice = tierEffectivePrice(base, tier);
    if (tierPrice < bestPrice) {
      bestPrice = tierPrice;
      appliedTier = tier;
    }
  }

  return {
    pricePerPersonUsd: bestPrice,
    basePriceUsd: base,
    savingsPerPersonUsd: Math.max(0, base - bestPrice),
    appliedTier,
  };
}

function formatGuestRange(minGuests: number, maxGuests?: number | null): string {
  if (maxGuests == null) {
    return `от ${formatPeople(minGuests)}`;
  }
  if (minGuests === maxGuests) {
    return formatPeople(minGuests);
  }
  return `${minGuests}–${maxGuests} ${peopleWord(maxGuests)}`;
}

export function formatGroupDiscountTierGuestRange(tier: GroupDiscountTier): string {
  return formatGuestRange(tier.minGuests, tier.maxGuests);
}

export function formatGroupDiscountTierValueLabel(
  tier: GroupDiscountTier,
  basePriceUsd?: number
): string {
  if (tier.discountType === "percent") {
    return `${Math.round(tier.value)}%`;
  }
  const price = `${Math.round(tier.value)} $/чел.`;
  if (basePriceUsd != null && basePriceUsd > tier.value) {
    const pct = Math.round(((basePriceUsd - tier.value) / basePriceUsd) * 100);
    return `${price} (−${pct}%)`;
  }
  return price;
}

export function formatGroupDiscountTierLabel(
  tier: GroupDiscountTier,
  basePriceUsd?: number
): string {
  const range = formatGroupDiscountTierGuestRange(tier);
  if (tier.discountType === "percent") {
    return `${range} · ${Math.round(tier.value)}%`;
  }
  return `${range} · ${formatGroupDiscountTierValueLabel(tier, basePriceUsd)}`;
}

export function formatGroupDiscountTierShort(tier: GroupDiscountTier): string {
  if (tier.discountType === "percent") {
    return `−${Math.round(tier.value)}%`;
  }
  return `${Math.round(tier.value)} $/чел.`;
}

export function getBestGroupDiscountHint(
  settings: GroupDiscountSettings | undefined,
  basePriceUsd: number
): string | null {
  const normalized = normalizeGroupDiscountSettings(settings);
  if (!normalized.enabled) return null;

  const firstTier = normalized.tiers[0];
  if (!firstTier) return null;

  return formatGroupDiscountTierLabel(firstTier, basePriceUsd);
}

export function createEmptyGroupDiscountTier(
  discountType: GroupDiscountType = "percent"
): GroupDiscountTier {
  return {
    id: crypto.randomUUID(),
    minGuests: 2,
    maxGuests: null,
    discountType,
    value: discountType === "percent" ? 5 : 0,
  };
}
