import type { TourDatePrice } from "@/types";

export type OrganizerPrepaymentType = "percent" | "fixed";

export interface OrganizerGroupTourDate {
  id: string;
  startDate: string;
  endDate: string;
  priceUsd: number;
  totalSeats: number;
  spotsLeft: number;
  fullPaymentDaysBefore: number;
  prepaymentAmount: number;
  prepaymentType: OrganizerPrepaymentType;
  applyDiscount: boolean;
  notGuaranteed: boolean;
  flightIncluded: boolean;
}

export interface OrganizerGroupDatesBatchInput {
  startDates: string[];
  durationDays: number;
  priceUsd: number;
  totalSeats: number;
  spotsLeft: number;
  fullPaymentDaysBefore: number;
  prepaymentAmount: number;
  prepaymentType: OrganizerPrepaymentType;
  applyDiscount: boolean;
  notGuaranteed: boolean;
  flightIncluded: boolean;
}

export function createGroupDateId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `grp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function computeEndDateFromStart(startDate: string, durationDays: number): string {
  if (!startDate || durationDays < 1) return "";
  const start = new Date(`${startDate}T12:00:00`);
  if (Number.isNaN(start.getTime())) return "";
  start.setDate(start.getDate() + Math.max(durationDays - 1, 0));
  return start.toISOString().slice(0, 10);
}

export function createEmptyGroupTourDate(
  partial?: Partial<OrganizerGroupTourDate>
): OrganizerGroupTourDate {
  return {
    id: createGroupDateId(),
    startDate: "",
    endDate: "",
    priceUsd: 0,
    totalSeats: 0,
    spotsLeft: 0,
    fullPaymentDaysBefore: 0,
    prepaymentAmount: 15,
    prepaymentType: "percent",
    applyDiscount: false,
    notGuaranteed: false,
    flightIncluded: false,
    ...partial,
  };
}

export function buildGroupTourDatesFromBatch(
  input: OrganizerGroupDatesBatchInput
): OrganizerGroupTourDate[] {
  return input.startDates
    .filter(Boolean)
    .map((startDate) =>
      createEmptyGroupTourDate({
        startDate,
        endDate: computeEndDateFromStart(startDate, input.durationDays),
        priceUsd: input.priceUsd,
        totalSeats: input.totalSeats,
        spotsLeft: input.spotsLeft,
        fullPaymentDaysBefore: input.fullPaymentDaysBefore,
        prepaymentAmount: input.prepaymentAmount,
        prepaymentType: input.prepaymentType,
        applyDiscount: input.applyDiscount,
        notGuaranteed: input.notGuaranteed,
        flightIncluded: input.flightIncluded,
      })
    );
}

export function isoToDayMonth(iso?: string): string {
  if (!iso) return "";
  const parts = iso.split("-");
  if (parts.length !== 3) return "";
  const [, month, day] = parts;
  return `${day}.${month}`;
}

export function dayMonthToIso(dayMonth: string, year = new Date().getFullYear()): string {
  const match = dayMonth.trim().match(/^(\d{1,2})\.(\d{1,2})$/);
  if (!match) return "";
  const day = match[1].padStart(2, "0");
  const month = match[2].padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function normalizeGroupTourDate(
  date: Partial<OrganizerGroupTourDate> & Pick<OrganizerGroupTourDate, "id">
): OrganizerGroupTourDate {
  const base = createEmptyGroupTourDate(date);
  return {
    ...base,
    ...date,
    totalSeats: date.totalSeats ?? date.spotsLeft ?? base.totalSeats,
    spotsLeft: date.spotsLeft ?? base.spotsLeft,
  };
}

export function mapTourDatePriceToGroupDate(date: TourDatePrice): OrganizerGroupTourDate {
  return createEmptyGroupTourDate({
    id: date.id,
    startDate: date.startDate,
    endDate: date.endDate,
    priceUsd: date.priceUsd,
    totalSeats: date.spotsLeft,
    spotsLeft: date.spotsLeft,
  });
}

export function mapGroupDateToTourDatePrice(date: OrganizerGroupTourDate): TourDatePrice {
  return {
    id: date.id,
    startDate: date.startDate,
    endDate: date.endDate,
    priceUsd: date.priceUsd,
    spotsLeft: date.spotsLeft,
  };
}

export const DAY_MONTH_INPUT_PATTERN = /^\d{1,2}\.\d{1,2}$/;
