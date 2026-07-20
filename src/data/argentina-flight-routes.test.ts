import { describe, expect, it } from "vitest";
import {
  ARGENTINA_FLIGHT_ROUTES,
  getFlightDestinations,
  getFlightRoute,
  hasFlightDestinations,
} from "@/data/argentina-flight-routes";
import { ARGENTINA_AIRPORTS } from "@/data/argentina-airports";

describe("argentina-flight-routes", () => {
  it("Аэропарк (AEP) связан со всеми ключевыми направлениями", () => {
    const destinations = getFlightDestinations("AEP");
    const iatas = destinations.map((d) => d.iata);
    expect(iatas).toContain("BRC");
    expect(iatas).toContain("USH");
    expect(iatas).toContain("FTE");
    expect(iatas).toContain("IGR");
    expect(iatas).toContain("MDQ");
    expect(iatas).toContain("RGL");
    expect(destinations.length).toBeGreaterThanOrEqual(20);
  });

  it("карта покрыта аэропортами по всем регионам", () => {
    expect(ARGENTINA_AIRPORTS).toHaveLength(40);
    const regions = new Set(ARGENTINA_AIRPORTS.map((a) => a.region));
    expect(regions.has("Patagonia")).toBe(true);
    expect(regions.has("Tierra del Fuego")).toBe(true);
    expect(regions.has("Misiones")).toBe(true);
  });

  it("включает Чапелько и остальные аэропорты с расписанием", () => {
    const airportIatas = ARGENTINA_AIRPORTS.map((airport) => airport.iata);
    expect(airportIatas).toEqual(
      expect.arrayContaining(["CPC", "PMY", "VDM", "PMQ", "FMA", "IRJ", "CTC", "PRA", "SFN"]),
    );

    expect(getFlightDestinations("CPC").map((destination) => destination.iata)).toEqual(
      expect.arrayContaining(["AEP", "EZE", "COR", "ROS"]),
    );
    expect(getFlightRoute("PMQ", "CRD")).toMatchObject({
      durationMinutes: 40,
      service: "seasonal_or_limited",
    });
  });

  it("маршруты симметричны: из Барилоче можно вернуться в Буэнос-Айрес", () => {
    const fromBariloche = getFlightDestinations("BRC").map((d) => d.iata);
    expect(fromBariloche).toContain("AEP");
    expect(fromBariloche).toContain("EZE");
  });

  it("показывает прямой маршрут Пуэрто-Игуасу — Сальта", () => {
    const fromIguazu = getFlightDestinations("IGR").map((destination) => destination.iata);
    expect(fromIguazu).toContain("SLA");

    const route = getFlightRoute("SLA", "IGR");
    expect(route).toMatchObject({
      from: "IGR",
      to: "SLA",
      durationMinutes: 125,
      service: "regular",
    });
    expect(route?.airlines).toContain("Aerolíneas Argentinas");
  });

  it("покрывает региональные маршруты не только через Буэнос-Айрес", () => {
    expect(getFlightDestinations("COR").map((destination) => destination.iata)).toEqual(
      expect.arrayContaining(["BRC", "FTE", "IGR", "JUJ", "MDZ", "NQN", "SLA", "TUC", "USH"]),
    );
    expect(getFlightDestinations("ROS").map((destination) => destination.iata)).toEqual(
      expect.arrayContaining(["BRC", "IGR", "MDQ", "SLA"]),
    );
  });

  it("неизвестный IATA-код возвращает пустой список", () => {
    expect(getFlightDestinations("XXX")).toEqual([]);
    expect(hasFlightDestinations("XXX")).toBe(false);
  });

  it("каждое направление ссылается на существующий аэропорт", () => {
    const knownIds = new Set(ARGENTINA_AIRPORTS.map((a) => a.id));
    for (const airport of ARGENTINA_AIRPORTS) {
      for (const dest of getFlightDestinations(airport.iata)) {
        expect(knownIds.has(dest.id)).toBe(true);
        expect(dest.iata).not.toBe(airport.iata);
      }
    }
  });

  it("у каждого аэропорта карты есть хотя бы одно прямое направление", () => {
    for (const airport of ARGENTINA_AIRPORTS) {
      expect(hasFlightDestinations(airport.iata), airport.iata).toBe(true);
    }
  });

  it("не содержит повторяющихся пар и неизвестных IATA-кодов", () => {
    const knownIatas = new Set(ARGENTINA_AIRPORTS.map((airport) => airport.iata));
    const pairs = new Set<string>();

    for (const route of ARGENTINA_FLIGHT_ROUTES) {
      expect(knownIatas.has(route.from)).toBe(true);
      expect(knownIatas.has(route.to)).toBe(true);
      const pair = [route.from, route.to].sort().join("-");
      expect(pairs.has(pair), pair).toBe(false);
      pairs.add(pair);
    }
  });

  it("направления отсортированы с севера на юг", () => {
    const destinations = getFlightDestinations("AEP");
    for (let i = 1; i < destinations.length; i++) {
      expect(destinations[i].latitude).toBeLessThanOrEqual(destinations[i - 1].latitude);
    }
  });
});
