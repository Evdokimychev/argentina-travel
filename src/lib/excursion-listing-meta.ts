import type { TripsterExperience } from "@/lib/tripster/types";
import type { ExcursionGuide, ExcursionPriceUnit } from "@/types/excursion";

export type ExcursionFormatKind = "group" | "individual";

export type ExcursionListingMeta = {
  guide?: ExcursionGuide;
  priceFrom: boolean;
  priceUnit: ExcursionPriceUnit;
  formatKind: ExcursionFormatKind;
};

function parseGuide(experience: TripsterExperience): ExcursionGuide | undefined {
  const guideRaw = experience.guide;
  if (!guideRaw || typeof guideRaw.id !== "number") return undefined;

  const name = guideRaw.first_name?.trim() || "Гид";
  return {
    id: guideRaw.id,
    name: name.charAt(0).toUpperCase() + name.slice(1),
    url: guideRaw.url,
    avatar:
      guideRaw.avatar?.medium ||
      guideRaw.avatar?.small ||
      guideRaw.avatar?.original,
  };
}

function resolvePriceUnit(experience: TripsterExperience): ExcursionPriceUnit {
  const price = experience.price;
  const hasGroup = price?.per_group?.value != null;
  const hasPerson = Array.isArray(price?.per_person) && price.per_person.length > 0;
  const model = experience.pricing_model?.toLowerCase() ?? "";

  if (model.includes("group") || (hasGroup && !hasPerson)) {
    return "per_excursion";
  }

  if (model.includes("person") || hasPerson) {
    return "per_person";
  }

  const description = price?.price_description?.toLowerCase() ?? "";
  if (description.includes("за 1 человека") || description.includes("per person")) {
    return "per_person";
  }
  if (description.includes("за экскурс") || description.includes("per group")) {
    return "per_excursion";
  }

  return experience.max_persons === 1 ? "per_person" : "per_excursion";
}

function resolveFormatKind(experience: TripsterExperience): ExcursionFormatKind {
  const productType = (experience.type ?? "").trim().toLowerCase();

  // Tripster partner API: type=private → индивидуальный формат, type=group → групповой.
  // exp_format is a product category code (often 1 for both); do not use it for formatKind.
  if (productType === "private") {
    return "individual";
  }
  if (productType === "group") {
    return "group";
  }
  if (productType === "tour") {
    return "group";
  }

  const format = (experience.format ?? "").toLowerCase();
  const scheduleType = (experience.schedule_type ?? "").toLowerCase();

  if (
    format === "private" ||
    format === "individual" ||
    format.includes("индивид") ||
    format.includes("individual") ||
    scheduleType.includes("individual")
  ) {
    return "individual";
  }

  if (
    format === "group" ||
    format === "group_tour" ||
    format.includes("групп") ||
    format.includes("group") ||
    scheduleType.includes("group")
  ) {
    return "group";
  }

  if (scheduleType === "weekly_range") {
    return "individual";
  }
  if (scheduleType === "weekly_slots" || scheduleType === "fixed_slots") {
    return "group";
  }

  if (productType === "experience") {
    return "individual";
  }

  return "group";
}

export function parseExcursionListingMeta(payload: unknown): ExcursionListingMeta {
  const experience = payload as TripsterExperience | null | undefined;
  if (!experience) {
    return {
      priceFrom: true,
      priceUnit: "per_person",
      formatKind: "group",
    };
  }

  const priceFrom = experience.price?.price_from !== false;

  return {
    guide: parseGuide(experience),
    priceFrom,
    priceUnit: resolvePriceUnit(experience),
    formatKind: resolveFormatKind(experience),
  };
}

export function excursionFormatLabelKey(kind: ExcursionFormatKind): string {
  return kind === "individual" ? "excursions.format.individual" : "excursions.format.group";
}

export function excursionPriceSuffixKey(unit: ExcursionPriceUnit): string {
  return unit === "per_excursion"
    ? "excursions.card.pricePerExcursion"
    : "excursions.card.pricePerPerson";
}
