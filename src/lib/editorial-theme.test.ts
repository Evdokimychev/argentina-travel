import { describe, expect, it } from "vitest";
import {
  resolveBlogEditorialTheme,
  resolveDestinationEditorialTheme,
  resolveGuideEditorialTheme,
} from "@/lib/editorial-theme";

describe("editorial themes", () => {
  it("assigns a stable theme to destination templates", () => {
    expect(resolveDestinationEditorialTheme("iguazu")).toBe("rainforest");
    expect(resolveDestinationEditorialTheme("calafate")).toBe("glacier");
    expect(resolveDestinationEditorialTheme("mendoza")).toBe("wine");
  });

  it("keeps unknown guide pages on the editorial default", () => {
    expect(resolveGuideEditorialTheme("pogoda-i-sezonnost")).toBe("glacier");
    expect(resolveGuideEditorialTheme("novaya-tema")).toBe("journal");
  });

  it("uses destination metadata before title heuristics for blog articles", () => {
    expect(
      resolveBlogEditorialTheme({
        title: "Большое путешествие",
        category: "Маршруты",
        tags: [],
        relatedDestinations: ["iguazu"],
      }),
    ).toBe("rainforest");
  });
});
