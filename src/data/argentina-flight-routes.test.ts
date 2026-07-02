import { describe, expect, it } from "vitest";
import { getFlightDestinations, hasFlightDestinations } from "@/data/argentina-flight-routes";
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
    expect(ARGENTINA_AIRPORTS.length).toBeGreaterThanOrEqual(24);
    const regions = new Set(ARGENTINA_AIRPORTS.map((a) => a.region));
    expect(regions.has("Patagonia")).toBe(true);
    expect(regions.has("Tierra del Fuego")).toBe(true);
    expect(regions.has("Misiones")).toBe(true);
  });

  it("маршруты симметричны: из Барилоче можно вернуться в Буэнос-Айрес", () => {
    const fromBariloche = getFlightDestinations("BRC").map((d) => d.iata);
    expect(fromBariloche).toContain("AEP");
    expect(fromBariloche).toContain("EZE");
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

  it("направления отсортированы с севера на юг", () => {
    const destinations = getFlightDestinations("AEP");
    for (let i = 1; i < destinations.length; i++) {
      expect(destinations[i].latitude).toBeLessThanOrEqual(destinations[i - 1].latitude);
    }
  });
});
