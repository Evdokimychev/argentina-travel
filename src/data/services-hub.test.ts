import { describe, expect, it } from "vitest";
import {
  getServiceBySlug,
  getServiceCategoriesForModules,
} from "@/data/services-hub";
import { DEFAULT_SITE_MODULES } from "@/lib/cms/site-globals/normalize";

describe("services hub travel modules", () => {
  it("keeps apartments via contact request by default, with transfers and car-rental off until enabled", () => {
    const categories = getServiceCategoriesForModules(DEFAULT_SITE_MODULES);
    expect(categories.map((category) => category.id)).toEqual(
      expect.arrayContaining(["apartments"]),
    );
    expect(categories.map((category) => category.id)).not.toContain("transfers");
    expect(categories.map((category) => category.id)).not.toContain("car-rental");
    expect(getServiceBySlug("apartment-rental")?.href).toBe(
      "/contacts?service=apartment-rental",
    );
  });

  it("removes disabled or hidden modules from public discovery", () => {
    const categories = getServiceCategoriesForModules({
      ...DEFAULT_SITE_MODULES,
      apartmentsMode: "disabled",
      carRentalMode: "disabled",
      showTransfersInServices: false,
    });

    expect(categories.map((category) => category.id)).not.toEqual(
      expect.arrayContaining(["apartments", "car-rental", "transfers"]),
    );
  });

  it("does not publish hotels while the module is only planned", () => {
    const categories = getServiceCategoriesForModules({
      ...DEFAULT_SITE_MODULES,
      hotelsMode: "planned",
    });
    expect(categories.some((category) => category.id === "hotels")).toBe(false);
  });

  it("replaces partner transfer search with a manager request in request mode", () => {
    const categories = getServiceCategoriesForModules({
      ...DEFAULT_SITE_MODULES,
      transfersMode: "request",
      showTransfersInServices: true,
    });
    const transfers = categories.find((category) => category.id === "transfers");

    expect(transfers?.items).toHaveLength(1);
    expect(transfers?.items[0]?.href).toBe("/contacts?service=transfer-request");
    expect(getServiceBySlug("transfer-request")?.title).toBe("Запросить трансфер");
  });
});
