import { describe, expect, it } from "vitest";
import { pageTitle, SITE_TITLE_BRAND } from "@/lib/metadata/page-title";

describe("pageTitle", () => {
  it("strips default brand suffix", () => {
    expect(pageTitle(`Игуасу | ${SITE_TITLE_BRAND}`)).toBe("Игуасу");
    expect(pageTitle(`Игуасу — ${SITE_TITLE_BRAND}`)).toBe("Игуасу");
  });

  it("strips custom brand suffix when provided", () => {
    expect(pageTitle("Маршрут | Go Argentina", "Go Argentina")).toBe("Маршрут");
  });

  it("leaves title unchanged when brand not present", () => {
    expect(pageTitle("Только заголовок")).toBe("Только заголовок");
  });
});
