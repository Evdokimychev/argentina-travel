import { findPopularRouteLabel, resolveTourFlightRouteIds } from "@/lib/flights/destination-airports";
import {
  DEFAULT_HOME_FLIGHT_DESTINATION,
  getFlightHubLabel,
} from "@/lib/flights/home-flight-hubs";

export type MeetingPointFlightDestination = {
  code: string;
  label: string;
};

const MEETING_POINT_RULES: Array<{ test: RegExp; code: string; label: string }> = [
  { test: /rio[\s-]?de[\s-]?janeiro|рио[\s-]?де[\s-]?жанейро/i, code: "RIO", label: "Рио-де-Жанейро" },
  { test: /s[aã]o[\s-]?paulo|с[aã]o[\s-]?paulo|сан[\s-]?паулу/i, code: "SAO", label: "Сан-Паулу" },
  { test: /bras[ií]lia|бразили/i, code: "BSB", label: "Бразилиа" },
  { test: /salvador|салвадор/i, code: "SSA", label: "Салвадор" },
  { test: /recife|ресифи/i, code: "REC", label: "Ресифи" },
  { test: /fortaleza|форталез/i, code: "FOR", label: "Форталеза" },
  { test: /buenos[\s-]?aires|буэнос[\s-]?айрес/i, code: "BUE", label: "Буэнос-Айрес" },
  { test: /ushuaia|ушуайя/i, code: "USH", label: "Ушуайя" },
  { test: /calafate|калафат|el[\s-]?calafate|эль[\s-]?калафат/i, code: "FTE", label: "Эль-Калафате" },
  { test: /bariloche|барилоч/i, code: "BRC", label: "Барилоче" },
  { test: /iguaz[uú]|игуас/i, code: "IGR", label: "Игуасу" },
  { test: /mendoza|мендос/i, code: "MDZ", label: "Мендоса" },
  { test: /salta|сальт/i, code: "SLA", label: "Сальта" },
  { test: /cordoba|кордов/i, code: "COR", label: "Кордова" },
  { test: /madrid|мадрид/i, code: "MAD", label: "Мадрид" },
  { test: /istanbul|стамбул/i, code: "IST", label: "Стамбул" },
  { test: /santiago|сантьяго/i, code: "SCL", label: "Сантьяго" },
  { test: /lima|лим/i, code: "LIM", label: "Лима" },
  { test: /bogot[aá]|богот/i, code: "BOG", label: "Богота" },
];

/** Aviasales-код и подпись для поиска билетов до места встречи тура. */
export function resolveMeetingPointFlightDestination(
  meetingPoint: string,
): MeetingPointFlightDestination {
  const trimmed = meetingPoint.trim();
  if (!trimmed) {
    return {
      code: DEFAULT_HOME_FLIGHT_DESTINATION,
      label: getFlightHubLabel(DEFAULT_HOME_FLIGHT_DESTINATION),
    };
  }

  for (const rule of MEETING_POINT_RULES) {
    if (rule.test.test(trimmed)) {
      return { code: rule.code, label: rule.label };
    }
  }

  const routeIds = resolveTourFlightRouteIds(trimmed, "");
  const domesticRoute = routeIds.length > 1 ? findPopularRouteLabel(routeIds[routeIds.length - 1]!) : undefined;
  if (domesticRoute && domesticRoute.origin === "BUE") {
    return { code: domesticRoute.destination, label: domesticRoute.destinationLabel };
  }

  const primaryRoute = findPopularRouteLabel(routeIds[0] ?? "mow-bue");
  if (primaryRoute) {
    return { code: primaryRoute.destination, label: primaryRoute.destinationLabel };
  }

  return {
    code: DEFAULT_HOME_FLIGHT_DESTINATION,
    label: getFlightHubLabel(DEFAULT_HOME_FLIGHT_DESTINATION),
  };
}
