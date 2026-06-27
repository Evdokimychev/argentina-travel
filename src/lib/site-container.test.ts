import { describe, expect, it } from "vitest";
import { siteCatalogContainerClass, siteContainerClass } from "@/lib/site-container";

describe("site-container", () => {
  it("siteContainerClass uses unified wide max width", () => {
    expect(siteContainerClass).toContain("max-w-screen-2xl");
    expect(siteContainerClass).not.toContain("max-w-7xl");
  });

  it("siteCatalogContainerClass is an alias of siteContainerClass", () => {
    expect(siteCatalogContainerClass).toBe(siteContainerClass);
  });
});
