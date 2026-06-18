import {
  getTourTravelRiskKindOption,
  TOUR_TRAVEL_RISK_KINDS_FLAT,
  type TourTravelRiskKind,
} from "@/data/tour-travel-risk-kinds";
import type { TourTravelRisk } from "@/types/tour-travel-risk";
import { ORGANIZER_TOUR_TRAVEL_RISK_DESCRIPTION_MAX } from "@/types/tour-travel-risk";

export function createTravelRiskId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `risk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createTravelRisk(kind: TourTravelRiskKind): TourTravelRisk {
  return { id: createTravelRiskId(), kind };
}

function normalizeKind(value: unknown): TourTravelRiskKind {
  if (
    typeof value === "string" &&
    TOUR_TRAVEL_RISK_KINDS_FLAT.includes(value as TourTravelRiskKind)
  ) {
    return value as TourTravelRiskKind;
  }
  return "custom";
}

export function normalizeTravelRisk(raw: Partial<TourTravelRisk>): TourTravelRisk {
  const kind = normalizeKind(raw.kind);
  const title = raw.title?.trim();
  const description = raw.description?.trim().slice(0, ORGANIZER_TOUR_TRAVEL_RISK_DESCRIPTION_MAX);

  return {
    id: raw.id?.trim() || createTravelRiskId(),
    kind,
    title: title || undefined,
    description: description || undefined,
  };
}

export function normalizeTravelRisks(items: Partial<TourTravelRisk>[] | undefined): TourTravelRisk[] {
  if (!items?.length) return [];

  const seen = new Set<TourTravelRiskKind>();
  const result: TourTravelRisk[] = [];

  for (const item of items) {
    const normalized = normalizeTravelRisk(item);
    if (seen.has(normalized.kind)) continue;
    seen.add(normalized.kind);
    result.push(normalized);
  }

  return result;
}

export function getTravelRiskDescription(risk: TourTravelRisk): string {
  const custom = risk.description?.trim();
  if (custom) return custom;
  return getTourTravelRiskKindOption(risk.kind).defaultHint;
}

export function toggleTravelRiskKind(
  risks: TourTravelRisk[],
  kind: TourTravelRiskKind
): TourTravelRisk[] {
  const exists = risks.some((risk) => risk.kind === kind);
  if (exists) return risks.filter((risk) => risk.kind !== kind);
  if (risks.length >= 12) return risks;
  return [...risks, createTravelRisk(kind)];
}

export function updateTravelRiskAt(
  risks: TourTravelRisk[],
  id: string,
  patch: Partial<TourTravelRisk>
): TourTravelRisk[] {
  return risks.map((risk) => (risk.id === id ? normalizeTravelRisk({ ...risk, ...patch }) : risk));
}
