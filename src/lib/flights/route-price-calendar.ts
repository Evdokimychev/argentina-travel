import "server-only";

import { unstable_cache } from "next/cache";
import {
  fetchMonthlyFlightPrices,
  type MonthlyFlightPrice,
} from "@/lib/travelpayouts/aviasales/data-api";
import { resolveAviasalesMarket } from "@/lib/travelpayouts/aviasales";
import { isTravelpayoutsConfigured } from "@/lib/travelpayouts";
import type { LocaleCode } from "@/types/locale";

async function fetchRoutePriceCalendarUncached(
  origin: string,
  destination: string,
  locale: LocaleCode = "ru"
): Promise<MonthlyFlightPrice[]> {
  if (!isTravelpayoutsConfigured()) return [];

  const market = resolveAviasalesMarket(locale);
  return fetchMonthlyFlightPrices({
    origin,
    destination,
    currency: market.currency,
    monthCount: 3,
  });
}

export function getRoutePriceCalendar(
  origin: string,
  destination: string,
  locale: LocaleCode = "ru"
) {
  return unstable_cache(
    () => fetchRoutePriceCalendarUncached(origin, destination, locale),
    ["route-price-calendar", locale, origin, destination],
    { revalidate: 86400 }
  )();
}
