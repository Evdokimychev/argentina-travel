import { describe, expect, it } from "vitest";
import { TRAVELPAYOUTS_WL_RESPONSIVE_CSS } from "./ensure-wl-search-responsive";

describe("Travelpayouts mobile search layout", () => {
  it("keeps the search action inside a two-column mobile grid", () => {
    expect(TRAVELPAYOUTS_WL_RESPONSIVE_CSS).toContain("@media (max-width: 1023px)");
    expect(TRAVELPAYOUTS_WL_RESPONSIVE_CSS).toContain("DefaultSearch-module__submitBtn");
    expect(TRAVELPAYOUTS_WL_RESPONSIVE_CSS).toContain("width: 100% !important");
  });
});
