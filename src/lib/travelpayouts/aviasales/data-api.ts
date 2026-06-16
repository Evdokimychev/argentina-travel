import "server-only";

import { getTravelpayoutsConfig } from "@/lib/travelpayouts/env";
import type { FlightPriceOffer } from "@/lib/travelpayouts/aviasales/types";

const DATA_API_BASE = "https://api.travelpayouts.com";

type RawPriceRow = {
  origin?: string;
  destination?: string;
  departure_at?: string;
  return_at?: string;
  value?: number;
  found_at?: string;
  number_of_changes?: number;
  duration?: number;
  distance?: number;
  gate?: string;
  airline?: string;
  flight_number?: string;
  link?: string;
};

function mapOffer(row: RawPriceRow, currency: string, index: number): FlightPriceOffer | null {
  if (!row.origin || !row.destination || !row.departure_at || row.value == null) return null;

  return {
    id: `${row.origin}-${row.destination}-${row.departure_at}-${row.return_at ?? "ow"}-${index}`,
    origin: row.origin,
    destination: row.destination,
    departureAt: row.departure_at,
    returnAt: row.return_at ?? undefined,
    price: row.value,
    currency,
    airline: row.airline,
    flightNumber: row.flight_number,
    transfers: row.number_of_changes ?? 0,
    durationMinutes: row.duration,
    ticketPath: row.link,
  };
}

export async function fetchFlightPricesForDates(input: {
  origin: string;
  destination: string;
  departureAt: string;
  returnAt?: string;
  currency: string;
  market: string;
  oneWay: boolean;
  limit?: number;
}): Promise<FlightPriceOffer[]> {
  const config = getTravelpayoutsConfig();
  const url = new URL(`${DATA_API_BASE}/aviasales/v3/prices_for_dates`);
  url.searchParams.set("origin", input.origin.toUpperCase());
  url.searchParams.set("destination", input.destination.toUpperCase());
  url.searchParams.set("departure_at", input.departureAt);
  if (input.returnAt) url.searchParams.set("return_at", input.returnAt);
  url.searchParams.set("currency", input.currency);
  url.searchParams.set("market", input.market);
  url.searchParams.set("one_way", input.oneWay ? "true" : "false");
  url.searchParams.set("limit", String(input.limit ?? 20));
  url.searchParams.set("page", "1");
  url.searchParams.set("sorting", "price");
  url.searchParams.set("direct", "false");
  url.searchParams.set("token", config.apiKey);

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) return [];

  const payload = (await response.json().catch(() => null)) as { data?: RawPriceRow[] } | null;
  const rows = payload?.data ?? [];

  return rows
    .map((row, index) => mapOffer(row, input.currency, index))
    .filter((offer): offer is FlightPriceOffer => offer != null);
}

type RawMonthMatrixRow = {
  origin?: string;
  destination?: string;
  depart_date?: string;
  value?: number;
  number_of_changes?: number;
};

export type MonthlyFlightPrice = {
  month: string;
  cheapestPrice: number;
  cheapestDate: string;
  currency: string;
};

function monthStartOffsets(count: number): string[] {
  const now = new Date();
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() + index, 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}-01`;
  });
}

export async function fetchMonthlyFlightPrices(input: {
  origin: string;
  destination: string;
  currency: string;
  monthCount?: number;
}): Promise<MonthlyFlightPrice[]> {
  const config = getTravelpayoutsConfig();
  const months = monthStartOffsets(input.monthCount ?? 3);
  const results: MonthlyFlightPrice[] = [];

  for (const month of months) {
    const url = new URL(`${DATA_API_BASE}/v2/prices/month-matrix`);
    url.searchParams.set("origin", input.origin.toUpperCase());
    url.searchParams.set("destination", input.destination.toUpperCase());
    url.searchParams.set("currency", input.currency);
    url.searchParams.set("month", month);
    url.searchParams.set("show_to_affiliates", "true");
    url.searchParams.set("token", config.apiKey);

    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) continue;

    const payload = (await response.json().catch(() => null)) as
      | { success?: boolean; data?: RawMonthMatrixRow[] }
      | RawMonthMatrixRow[]
      | null;

    const rows = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
        ? payload.data
        : [];

    if (rows.length === 0) continue;

    let cheapest: RawMonthMatrixRow | null = null;
    for (const row of rows) {
      if (row.value == null || !row.depart_date) continue;
      if (!cheapest || row.value < (cheapest.value ?? Number.MAX_SAFE_INTEGER)) {
        cheapest = row;
      }
    }

    if (!cheapest?.value || !cheapest.depart_date) continue;

    results.push({
      month: month.slice(0, 7),
      cheapestPrice: cheapest.value,
      cheapestDate: cheapest.depart_date,
      currency: input.currency.toUpperCase(),
    });
  }

  return results;
}

export async function fetchLatestFlightPrices(input: {
  origin: string;
  destination: string;
  currency: string;
  limit?: number;
}): Promise<FlightPriceOffer[]> {
  const config = getTravelpayoutsConfig();
  const url = new URL(`${DATA_API_BASE}/v2/prices/latest`);
  url.searchParams.set("origin", input.origin.toUpperCase());
  url.searchParams.set("destination", input.destination.toUpperCase());
  url.searchParams.set("currency", input.currency);
  url.searchParams.set("limit", String(input.limit ?? 10));
  url.searchParams.set("token", config.apiKey);

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) return [];

  const payload = (await response.json().catch(() => null)) as RawPriceRow[] | null;
  if (!Array.isArray(payload)) return [];

  return payload
    .map((row, index) => mapOffer(row, input.currency, index))
    .filter((offer): offer is FlightPriceOffer => offer != null);
}
