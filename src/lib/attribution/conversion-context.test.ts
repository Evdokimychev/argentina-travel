import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import {
  buildConversionContext,
  getStoredConversionContext,
  persistConversionContext,
} from "@/lib/attribution/conversion-context";

describe("conversion-context", () => {
  beforeEach(() => {
    const storage = new Map<string, string>();
    vi.stubGlobal("window", {
      sessionStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => {
          storage.set(key, value);
        },
        removeItem: (key: string) => {
          storage.delete(key);
        },
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("persists stable placement ids without button copy", () => {
    const saved = persistConversionContext({
      placement: "map_tour_list",
      productId: "patagonia-14",
      productType: "tour",
      source: "map",
    });
    expect(saved?.placement).toBe("map_tour_list");
    expect(getStoredConversionContext()?.productId).toBe("patagonia-14");
    expect(buildConversionContext({})).toBeNull();
  });
});
