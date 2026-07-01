import { describe, expect, it } from "vitest";
import { resolveLocaleBreadcrumbItems } from "@/lib/locale-breadcrumbs";

describe("resolveLocaleBreadcrumbItems", () => {
  it("resolves Russian breadcrumbs by default", () => {
    const items = resolveLocaleBreadcrumbItems(undefined, [
      { labelKey: "nav.home", path: "/" },
      { labelKey: "places.title", path: "/places", fallback: "Места Аргентины" },
    ]);

    expect(items).toEqual([
      { name: "Главная", path: "/" },
      { name: "Места Аргентины", path: "/places" },
    ]);
  });

  it("resolves English breadcrumbs for /en locale", () => {
    const items = resolveLocaleBreadcrumbItems("en", [
      { labelKey: "nav.home", path: "/" },
      { labelKey: "places.title", path: "/places", fallback: "Места Аргентины" },
    ]);

    expect(items[0]?.name).toBe("Home");
    expect(items[1]?.name).toBe("Places in Argentina");
    expect(items.some((item) => item.name === "Главная")).toBe(false);
  });

  it("resolves Spanish breadcrumbs for /es locale", () => {
    const items = resolveLocaleBreadcrumbItems("es", [
      { labelKey: "nav.home", path: "/" },
      { labelKey: "places.title", path: "/places", fallback: "Места Аргентины" },
    ]);

    expect(items[0]?.name).toBe("Inicio");
    expect(items[1]?.name).toBe("Lugares de Argentina");
  });

  it("uses fallback when key is missing from bundle", () => {
    const items = resolveLocaleBreadcrumbItems("es", [
      { labelKey: "missing.key", path: "/test", fallback: "Fallback label" },
    ]);

    expect(items).toEqual([{ name: "Fallback label", path: "/test" }]);
  });
});
