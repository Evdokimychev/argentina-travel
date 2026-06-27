import { resolveExcursionAdditionalServices } from "@/lib/excursion-calendar";
import { formatExcursionDuration } from "@/lib/excursion-format";
import { formatMovementType } from "@/lib/excursion-labels";
import { formatPartnerLanguageSummary } from "@/lib/tripster/partner-tour-labels";
import type { ExcursionDetail, ExcursionFormatKind } from "@/types/excursion";

export type ExcursionDetailItem = {
  id: string;
  label: string;
  value: string;
  linkHref?: string;
};

export function normalizeExcursionMovementType(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const lower = value.trim().toLowerCase();
  if (lower === "walk" || lower === "walking") return "foot";
  return value;
}

export function formatExcursionFormatDetailValue(
  formatKind: ExcursionFormatKind,
  maxPersons: number | undefined,
  t: (key: string) => string,
): string {
  if (formatKind === "individual") {
    const max = maxPersons != null && maxPersons > 0 ? maxPersons : 10;
    return t("excursions.format.individualDetail")
      .replace("{min}", "1")
      .replace("{max}", String(max));
  }

  if (maxPersons != null && maxPersons > 0) {
    return t("excursions.format.groupDetail").replace("{max}", String(maxPersons));
  }

  return t("excursions.format.group");
}

export function buildExcursionDetailItems(
  excursion: ExcursionDetail,
  t: (key: string) => string,
): ExcursionDetailItem[] {
  const items: ExcursionDetailItem[] = [];

  const movement = formatMovementType(normalizeExcursionMovementType(excursion.movementType), t);
  if (movement) {
    items.push({ id: "movement", label: t("excursions.detail.movement"), value: movement });
  }

  const duration = formatExcursionDuration(excursion.durationMinutes, t);
  if (duration) {
    items.push({ id: "duration", label: t("excursions.detail.duration"), value: duration });
  }

  if (excursion.childFriendly != null) {
    const value = excursion.childFriendly
      ? t("excursions.meta.childFriendly")
      : t("excursions.detail.childNotFriendly");
    items.push({ id: "children", label: t("excursions.detail.children"), value });
  }

  const languageSummary = formatPartnerLanguageSummary(excursion.languages);
  if (languageSummary) {
    items.push({
      id: "languages",
      label: t("excursions.detail.languages"),
      value: languageSummary,
    });
  }

  const formatKind = excursion.formatKind ?? "individual";
  items.push({
    id: "format",
    label: t("excursions.detail.format"),
    value: formatExcursionFormatDetailValue(formatKind, excursion.maxPersons, t),
  });

  const services = resolveExcursionAdditionalServices(excursion.ticketOptions);
  if (services.length > 0) {
    items.push({
      id: "additional-services",
      label: t("excursions.detail.additionalServices"),
      value: t("excursions.additionalServices.teaser"),
      linkHref: "#additional-services",
    });
  }

  return items;
}

export function hasExcursionDetailItems(excursion: ExcursionDetail): boolean {
  return buildExcursionDetailItems(excursion, (key) => key).length > 0;
}
