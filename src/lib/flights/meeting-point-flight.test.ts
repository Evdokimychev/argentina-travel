import { describe, expect, it } from "vitest";
import { resolveMeetingPointFlightDestination } from "@/lib/flights/meeting-point-flight";
import { resolveNearestFlightOriginHub } from "@/lib/flights/nearest-flight-origin";

describe("resolveMeetingPointFlightDestination", () => {
  it("maps Rio de Janeiro to RIO", () => {
    expect(resolveMeetingPointFlightDestination("Рио-де-Жанейро")).toEqual({
      code: "RIO",
      label: "Рио-де-Жанейро",
    });
  });

  it("maps Buenos Aires to BUE", () => {
    expect(resolveMeetingPointFlightDestination("Буэнос-Айрес, Аргентина")).toEqual({
      code: "BUE",
      label: "Буэнос-Айрес",
    });
  });
});

describe("resolveNearestFlightOriginHub", () => {
  it("prefers Moscow for coordinates near Moscow", () => {
    expect(resolveNearestFlightOriginHub(55.75, 37.62)).toBe("MOW");
  });

  it("prefers Rio for coordinates near Rio", () => {
    expect(resolveNearestFlightOriginHub(-22.9, -43.2)).toBe("RIO");
  });
});
