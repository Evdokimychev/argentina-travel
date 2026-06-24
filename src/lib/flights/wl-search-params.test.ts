import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildFlightsSearchQueryParams,
  buildFlightsWlEmbedHref,
  buildParsedFlightsSearchFromSubmit,
  ensureWlSearchParamsInUrl,
  hasMinimumFlightsSearchParams,
  mergeTourFlightSearchesIntoComplex,
  parseFlightsSearchParams,
  restoreInlineWlSearchParams,
  stripWlSearchParamsFromQuery,
} from "@/lib/flights/wl-search-params";

describe("hasMinimumFlightsSearchParams", () => {
  it("requires origin, destination, and depart date", () => {
    const complete = buildParsedFlightsSearchFromSubmit({
      origin: "MOW",
      destination: "RIO",
      departDate: "2025-11-15",
      adults: 1,
      children: 0,
      infants: 0,
      tripClass: 0,
      oneWay: true,
    });
    expect(hasMinimumFlightsSearchParams(complete)).toBe(true);

    const missingDate = buildParsedFlightsSearchFromSubmit({
      origin: "MOW",
      destination: "RIO",
      adults: 1,
      children: 0,
      infants: 0,
      tripClass: 0,
      oneWay: true,
    });
    expect(hasMinimumFlightsSearchParams(missingDate)).toBe(false);
  });

  it("requires every segment to have a depart date for complex routes", () => {
    const complete = mergeTourFlightSearchesIntoComplex([
      buildParsedFlightsSearchFromSubmit({
        origin: "MOW",
        destination: "RIO",
        departDate: "2025-11-10",
        adults: 1,
        children: 0,
        infants: 0,
        tripClass: 0,
        oneWay: true,
      }),
      buildParsedFlightsSearchFromSubmit({
        origin: "BUE",
        destination: "MOW",
        departDate: "2025-11-20",
        adults: 1,
        children: 0,
        infants: 0,
        tripClass: 0,
        oneWay: true,
      }),
    ]);

    expect(complete).not.toBeNull();
    expect(hasMinimumFlightsSearchParams(complete!)).toBe(true);

    const incomplete = {
      ...complete!,
      segments: [
        complete!.segments![0]!,
        { ...complete!.segments![1]!, departDate: "" },
      ],
    };
    expect(hasMinimumFlightsSearchParams(incomplete)).toBe(false);
  });
});

describe("parseFlightsSearchParams", () => {
  it("reads WL param names and autoSearch flag", () => {
    const params = new URLSearchParams({
      origin_iata: "mow",
      destination_iata: "rio",
      depart_date: "2025-11-15",
      adults: "2",
      children: "0",
      infants: "0",
      trip_class: "0",
      one_way: "true",
      search: "1",
    });

    const parsed = parseFlightsSearchParams(params);
    expect(parsed).toMatchObject({
      origin: "MOW",
      destination: "RIO",
      departDate: "2025-11-15",
      adults: 2,
      tripType: "one_way",
      autoSearch: true,
    });
  });

  it("reads complex route segments from URL", () => {
    const params = new URLSearchParams({
      origin_iata: "MOW",
      destination_iata: "RIO",
      adults: "1",
      children: "0",
      infants: "0",
      trip_class: "0",
      one_way: "true",
      search: "1",
    });
    params.set("segments[0][origin_iata]", "MOW");
    params.set("segments[0][destination_iata]", "RIO");
    params.set("segments[0][depart_date]", "2025-11-10");
    params.set("segments[1][origin_iata]", "BUE");
    params.set("segments[1][destination_iata]", "MOW");
    params.set("segments[1][depart_date]", "2025-11-20");

    const parsed = parseFlightsSearchParams(params);
    expect(parsed?.segments).toEqual([
      { origin: "MOW", destination: "RIO", departDate: "2025-11-10" },
      { origin: "BUE", destination: "MOW", departDate: "2025-11-20" },
    ]);
    expect(hasMinimumFlightsSearchParams(parsed!)).toBe(true);
  });
});

describe("buildFlightsSearchQueryParams", () => {
  it("encodes complex routes as segments[] URL params", () => {
    const params = buildFlightsSearchQueryParams("MOW", "RIO", {
      adults: 2,
      autoSearch: true,
      segments: [
        { origin: "MOW", destination: "RIO", departDate: "2025-11-10" },
        { origin: "BUE", destination: "MOW", departDate: "2025-11-20" },
      ],
    });

    expect(params.get("segments[0][origin_iata]")).toBe("MOW");
    expect(params.get("segments[0][destination_iata]")).toBe("RIO");
    expect(params.get("segments[0][depart_date]")).toBe("2025-11-10");
    expect(params.get("segments[1][origin_iata]")).toBe("BUE");
    expect(params.get("segments[1][destination_iata]")).toBe("MOW");
    expect(params.get("segments[1][depart_date]")).toBe("2025-11-20");
    expect(params.get("search")).toBe("1");
    expect(params.get("return_date")).toBeNull();
  });

  it("keeps standard round-trip params without segments", () => {
    const params = buildFlightsSearchQueryParams("MOW", "BUE", {
      departDate: "2025-03-08",
      returnDate: "2025-03-17",
      oneWay: false,
      autoSearch: true,
    });

    expect(params.get("depart_date")).toBe("2025-03-08");
    expect(params.get("return_date")).toBe("2025-03-17");
    expect(params.get("segments[0][origin_iata]")).toBeNull();
  });
});

describe("buildFlightsWlEmbedHref", () => {
  it("uses /embed path so tour page URL is not modified", () => {
    const href = buildFlightsWlEmbedHref({
      origin: "MOW",
      destination: "RIO",
      departDate: "2025-11-15",
      adults: 1,
      children: 0,
      infants: 0,
      tripClass: 0,
      tripType: "one_way",
      autoSearch: true,
    });

    expect(href.startsWith("/embed/flights/wl?")).toBe(true);
    expect(href).toContain("origin_iata=MOW");
    expect(href).toContain("search=1");
  });
});

describe("mergeTourFlightSearchesIntoComplex", () => {
  it("merges two dated one-way legs into a complex search", () => {
    const merged = mergeTourFlightSearchesIntoComplex([
      buildParsedFlightsSearchFromSubmit({
        origin: "MOW",
        destination: "RIO",
        departDate: "2025-11-10",
        adults: 2,
        children: 0,
        infants: 0,
        tripClass: 0,
        oneWay: true,
      }),
      buildParsedFlightsSearchFromSubmit({
        origin: "BUE",
        destination: "MOW",
        departDate: "2025-11-20",
        adults: 2,
        children: 0,
        infants: 0,
        tripClass: 0,
        oneWay: true,
      }),
    ]);

    expect(merged).toMatchObject({
      origin: "MOW",
      destination: "RIO",
      departDate: "2025-11-10",
      adults: 2,
      autoSearch: true,
      segments: [
        { origin: "MOW", destination: "RIO", departDate: "2025-11-10" },
        { origin: "BUE", destination: "MOW", departDate: "2025-11-20" },
      ],
    });
  });

  it("returns null when any leg is missing a depart date", () => {
    const merged = mergeTourFlightSearchesIntoComplex([
      buildParsedFlightsSearchFromSubmit({
        origin: "MOW",
        destination: "RIO",
        departDate: "2025-11-10",
        adults: 1,
        children: 0,
        infants: 0,
        tripClass: 0,
        oneWay: true,
      }),
      buildParsedFlightsSearchFromSubmit({
        origin: "BUE",
        destination: "MOW",
        adults: 1,
        children: 0,
        infants: 0,
        tripClass: 0,
        oneWay: true,
      }),
    ]);

    expect(merged).toBeNull();
  });

  it("returns null for round-trip entries", () => {
    const merged = mergeTourFlightSearchesIntoComplex([
      buildParsedFlightsSearchFromSubmit({
        origin: "MOW",
        destination: "BUE",
        departDate: "2025-03-08",
        returnDate: "2025-03-17",
        adults: 1,
        children: 0,
        infants: 0,
        tripClass: 0,
        oneWay: false,
      }),
    ]);

    expect(merged).toBeNull();
  });
});

describe("stripWlSearchParamsFromQuery", () => {
  it("removes WL keys but keeps unrelated params", () => {
    const params = new URLSearchParams("access=secret&utm_source=email&origin_iata=MOW&search=1");
    stripWlSearchParamsFromQuery(params);
    expect(params.toString()).toBe("access=secret&utm_source=email");
  });
});

describe("ensureWlSearchParamsInUrl inline mode", () => {
  const searchFixture = buildParsedFlightsSearchFromSubmit({
    origin: "MOW",
    destination: "RIO",
    departDate: "2025-11-15",
    adults: 1,
    children: 0,
    infants: 0,
    tripClass: 0,
    oneWay: true,
  });

  let pathname = "/tours/patagonia";
  let search = "?access=abc123";
  let hash = "";

  beforeEach(() => {
    restoreInlineWlSearchParams();
    pathname = "/tours/patagonia";
    search = "?access=abc123";
    hash = "";

    vi.stubGlobal("window", {
      location: {
        get pathname() {
          return pathname;
        },
        get search() {
          return search;
        },
        get hash() {
          return hash;
        },
      },
      history: {
        replaceState(_state: unknown, _title: string, url: string) {
          const parsed = new URL(url, "https://example.com");
          pathname = parsed.pathname;
          search = parsed.search;
          hash = parsed.hash;
        },
        state: {},
      },
    });
  });

  afterEach(() => {
    restoreInlineWlSearchParams();
    vi.unstubAllGlobals();
  });

  it("merges WL params on tour pages without dropping access", () => {
    ensureWlSearchParamsInUrl({ ...searchFixture, autoSearch: true }, "inline");

    const params = new URLSearchParams(search);
    expect(params.get("access")).toBe("abc123");
    expect(params.get("origin_iata")).toBe("MOW");
    expect(params.get("destination_iata")).toBe("RIO");
    expect(params.get("depart_date")).toBe("2025-11-15");
    expect(params.get("search")).toBe("1");
  });

  it("restoreInlineWlSearchParams reverts staged URL", () => {
    ensureWlSearchParamsInUrl({ ...searchFixture, autoSearch: true }, "inline");
    expect(search).toContain("origin_iata=MOW");

    restoreInlineWlSearchParams();
    expect(search).toBe("?access=abc123");
  });

  it("does not run on tour pages in page mode", () => {
    ensureWlSearchParamsInUrl({ ...searchFixture, autoSearch: true }, "page");
    expect(search).toBe("?access=abc123");
  });
});
