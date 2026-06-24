import { describe, expect, it } from "vitest";
import { parseISO, startOfDay } from "date-fns";
import {
  resolveTourFlightFormSegments,
  resolveTourFlightPrefill,
  resolveTravelDays,
} from "@/lib/flights/tour-flight-prefill";
import { buildParsedFlightsSearchFromSubmit } from "@/lib/flights/wl-search-params";

function date(iso: string): Date {
  return startOfDay(parseISO(iso));
}

describe("resolveTravelDays", () => {
  it("uses 2 days for intercontinental MOW to South America", () => {
    expect(resolveTravelDays("MOW", "RIO")).toBe(2);
    expect(resolveTravelDays("MOW", "BUE")).toBe(2);
  });

  it("uses 0 days for BUE to domestic Argentina", () => {
    expect(resolveTravelDays("BUE", "USH")).toBe(0);
    expect(resolveTravelDays("BUE", "FTE")).toBe(0);
  });

  it("uses 1 day for cross South America", () => {
    expect(resolveTravelDays("RIO", "BUE")).toBe(1);
    expect(resolveTravelDays("SCL", "BUE")).toBe(1);
  });
});

describe("resolveTourFlightPrefill", () => {
  it("MOW→RIO tour Nov 17 → depart Nov 15 (2 day buffer)", () => {
    const result = resolveTourFlightPrefill({
      userOriginCode: "MOW",
      startCity: "Рио-де-Жанейро",
      tourStartDate: date("2025-11-17"),
      tourEndDate: date("2025-11-24"),
    });

    expect(result.form.origin).toBe("MOW");
    expect(result.form.destination).toBe("RIO");
    expect(result.form.departDate).toEqual(date("2025-11-15"));
    expect(result.form.returnDate).toEqual(date("2025-11-25"));
    expect(result.isOpenJaw).toBe(false);
    expect(result.hints[0]).toMatch(/Вылет за 2 дня/);
  });

  it("same city round trip BUE→BUE is not open jaw", () => {
    const result = resolveTourFlightPrefill({
      userOriginCode: "MOW",
      startCity: "Буэнос-Айрес",
      finishCity: "Буэнос-Айрес",
      tourStartDate: date("2025-03-10"),
      tourEndDate: date("2025-03-17"),
    });

    expect(result.isOpenJaw).toBe(false);
    expect(result.startDestination.code).toBe("BUE");
    expect(result.finishDestination.code).toBe("BUE");
    expect(result.legs).toBeUndefined();
  });

  it("without tour dates keeps routes only and no depart dates", () => {
    const result = resolveTourFlightPrefill({
      userOriginCode: "MOW",
      startCity: "Рио-де-Жанейро",
      finishCity: "Буэнос-Айрес",
    });

    expect(result.form.departDate).toBeUndefined();
    expect(result.form.returnDate).toBeUndefined();
    expect(result.legs?.every((leg) => leg.departDate == null)).toBe(true);
    expect(result.briefing.hasTourDates).toBe(false);
    expect(result.briefing.routeNote).toMatch(/два перелёта/);
  });

  it("builds briefing with schedule and outbound recommendation", () => {
    const result = resolveTourFlightPrefill({
      userOriginCode: "MOW",
      startCity: "Рио-де-Жанейро",
      finishCity: "Буэнос-Айрес",
      tourStartDate: date("2025-11-17"),
      tourEndDate: date("2025-11-28"),
      startTime: "16:00",
      finishTime: "12:00",
    });

    expect(result.briefing.hasTourDates).toBe(true);
    expect(result.briefing.schedule.start.dateLabel).toMatch(/17 ноября 2025/);
    expect(result.briefing.schedule.start.timeLabel).toBe("с 16:00");
    expect(result.briefing.recommendations.outboundDepartDate).toEqual(date("2025-11-15"));
    expect(result.briefing.recommendations.summary).toMatch(/рекомендуем вылететь/i);
  });

  it("Rio start, BA finish → isOpenJaw true", () => {
    const result = resolveTourFlightPrefill({
      userOriginCode: "MOW",
      startCity: "Рио-де-Жанейро",
      finishCity: "Буэнос-Айрес",
      tourStartDate: date("2025-11-17"),
      tourEndDate: date("2025-11-28"),
    });

    expect(result.isOpenJaw).toBe(true);
    expect(result.legs).toHaveLength(2);
    expect(result.legs![0]).toMatchObject({
      kind: "outbound",
      origin: "MOW",
      destination: "RIO",
    });
    expect(result.legs![1]).toMatchObject({
      kind: "return",
      origin: "BUE",
      destination: "MOW",
      departDate: date("2025-11-29"),
    });
    expect(result.hints.some((hint) => hint.includes("open-jaw"))).toBe(true);
    expect(result.briefing.recommendations.return?.reason).toMatch(/на следующий день после финиша/);
  });

  it("early start time increases outbound buffer by 1 day", () => {
    const withEarlyStart = resolveTourFlightPrefill({
      userOriginCode: "MOW",
      startCity: "Рио-де-Жанейро",
      tourStartDate: date("2025-11-17"),
      startTime: "08:00",
    });

    const normal = resolveTourFlightPrefill({
      userOriginCode: "MOW",
      startCity: "Рио-де-Жанейро",
      tourStartDate: date("2025-11-17"),
      startTime: "16:00",
    });

    expect(withEarlyStart.form.departDate).toEqual(date("2025-11-14"));
    expect(normal.form.departDate).toEqual(date("2025-11-15"));
  });

  it("return flight defaults to day after tour finish", () => {
    const onFinishDay = resolveTourFlightPrefill({
      userOriginCode: "MOW",
      startCity: "Буэнос-Айрес",
      tourStartDate: date("2025-03-10"),
      tourEndDate: date("2025-03-17"),
      finishTime: "14:00",
    });

    const lateFinish = resolveTourFlightPrefill({
      userOriginCode: "MOW",
      startCity: "Буэнос-Айрес",
      tourStartDate: date("2025-03-10"),
      tourEndDate: date("2025-03-17"),
      finishTime: "19:00",
    });

    expect(onFinishDay.form.returnDate).toEqual(date("2025-03-18"));
    expect(lateFinish.form.returnDate).toEqual(date("2025-03-18"));
    expect(onFinishDay.briefing.recommendations.return?.reason).not.toMatch(/в день финиша/);
  });
});

describe("resolveTourFlightFormSegments", () => {
  it("open-jaw yields two one-way segments with tab labels", () => {
    const prefill = resolveTourFlightPrefill({
      userOriginCode: "MOW",
      startCity: "Рио-де-Жанейро",
      finishCity: "Буэнос-Айрес",
      tourStartDate: date("2025-11-17"),
      tourEndDate: date("2025-11-28"),
    });

    const segments = resolveTourFlightFormSegments(prefill);
    expect(segments).toHaveLength(2);
    expect(segments[0]).toMatchObject({
      id: "outbound",
      kind: "outbound",
      tabLabel: "Туда",
      origin: "MOW",
      destination: "RIO",
    });
    expect(segments[1]).toMatchObject({
      id: "return",
      kind: "return",
      tabLabel: "Обратно",
      origin: "BUE",
      destination: "MOW",
    });
  });

  it("round trip yields single segment with return date", () => {
    const prefill = resolveTourFlightPrefill({
      userOriginCode: "MOW",
      startCity: "Буэнос-Айрес",
      finishCity: "Буэнос-Айрес",
      tourStartDate: date("2025-03-10"),
      tourEndDate: date("2025-03-17"),
    });

    const segments = resolveTourFlightFormSegments(prefill);
    expect(segments).toHaveLength(1);
    expect(segments[0]).toMatchObject({
      id: "roundtrip",
      kind: "roundtrip",
      origin: "MOW",
      destination: "BUE",
    });
    expect(segments[0]?.returnDate).toEqual(date("2025-03-18"));
  });
});

describe("buildParsedFlightsSearchFromSubmit (tour scenarios)", () => {
  it("open-jaw leg with depart date → one_way and autoSearch", () => {
    const parsed = buildParsedFlightsSearchFromSubmit({
      origin: "MOW",
      destination: "RIO",
      departDate: "2025-11-15",
      adults: 2,
      children: 0,
      infants: 0,
      tripClass: 0,
      oneWay: true,
    });

    expect(parsed.tripType).toBe("one_way");
    expect(parsed.autoSearch).toBe(true);
    expect(parsed.returnDate).toBeUndefined();
  });

  it("open-jaw leg without depart date → no autoSearch", () => {
    const parsed = buildParsedFlightsSearchFromSubmit({
      origin: "BUE",
      destination: "MOW",
      adults: 1,
      children: 0,
      infants: 0,
      tripClass: 0,
      oneWay: true,
    });

    expect(parsed.autoSearch).toBe(false);
    expect(parsed.departDate).toBeUndefined();
  });

  it("round trip with both dates → round_trip and autoSearch", () => {
    const parsed = buildParsedFlightsSearchFromSubmit({
      origin: "MOW",
      destination: "BUE",
      departDate: "2025-03-08",
      returnDate: "2025-03-17",
      adults: 1,
      children: 0,
      infants: 0,
      tripClass: 0,
      oneWay: false,
    });

    expect(parsed.tripType).toBe("round_trip");
    expect(parsed.returnDate).toBe("2025-03-17");
    expect(parsed.autoSearch).toBe(true);
  });

  it("round trip with depart only → one_way", () => {
    const parsed = buildParsedFlightsSearchFromSubmit({
      origin: "MOW",
      destination: "BUE",
      departDate: "2025-03-08",
      adults: 1,
      children: 0,
      infants: 0,
      tripClass: 0,
      oneWay: true,
    });

    expect(parsed.tripType).toBe("one_way");
    expect(parsed.returnDate).toBeUndefined();
  });
});
