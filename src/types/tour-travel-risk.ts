import type { TourTravelRiskKind } from "@/data/tour-travel-risk-kinds";

export interface TourTravelRisk {
  id: string;
  kind: TourTravelRiskKind;
  /** Пользовательский заголовок; если пусто — из каталога */
  title?: string;
  /** Что учесть участникам */
  description?: string;
}

export const ORGANIZER_TOUR_TRAVEL_RISKS_MAX = 12;
export const ORGANIZER_TOUR_TRAVEL_RISK_DESCRIPTION_MAX = 400;
