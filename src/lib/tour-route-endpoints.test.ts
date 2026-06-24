import { describe, expect, it } from "vitest";
import {
  hasTourEndpointLabels,
  resolveTourEndpointLabels,
} from "@/lib/tour-route-endpoints";

describe("resolveTourEndpointLabels", () => {
  it("prefers partner arrivalInfo cities", () => {
    expect(
      resolveTourEndpointLabels({
        partnerContent: {
          blocks: [],
          arrivalInfo: {
            startCity: "Рио-де-Жанейро, Бразилия",
            finishCity: "Буэнос-Айрес, Аргентина",
          },
        },
        startLocation: undefined,
        arrival: { airports: [], flights: [], transfers: [], meetingPoint: "" },
        routePoints: [],
      }),
    ).toEqual({
      start: "Рио-де-Жанейро, Бразилия",
      finish: "Буэнос-Айрес, Аргентина",
    });
  });

  it("falls back to meeting and finish points", () => {
    expect(
      resolveTourEndpointLabels({
        partnerContent: {
          blocks: [],
          meetingPoint: "Кordoba, Argentina",
          finishPoint: "Mendoza",
        },
        startLocation: "Salta",
        arrival: { airports: [], flights: [], transfers: [], meetingPoint: "ignored" },
        routePoints: [],
      }),
    ).toEqual({
      start: "Кordoba, Argentina",
      finish: "Mendoza",
    });
  });

  it("uses route points when nothing else is available", () => {
    expect(
      resolveTourEndpointLabels({
        partnerContent: undefined,
        startLocation: undefined,
        arrival: { airports: [], flights: [], transfers: [], meetingPoint: "" },
        routePoints: [
          { id: "1", name: "Ушуайя", lat: 0, lng: 0 },
          { id: "2", name: "Эль-Калафате", lat: 0, lng: 0 },
        ],
      }),
    ).toEqual({
      start: "Ушуайя",
      finish: "Эль-Калафате",
    });
  });

  it("detects when labels exist", () => {
    expect(hasTourEndpointLabels({ start: "A" })).toBe(true);
    expect(hasTourEndpointLabels({})).toBe(false);
  });
});
