import { describe, expect, it } from "vitest";
import { SITE_NAV_SECTIONS } from "@/data/site-nav";
import {
  DEFAULT_SITE_MODULES,
  DEFAULT_SITE_NAVIGATION,
} from "@/lib/cms/site-globals/normalize";
import {
  filterPublicLinks,
  filterPublicPaths,
  filterSiteNavSections,
  isPublicLinkEnabled,
  isPublicPathIncludedInSearch,
  isPublicPathIncludedInSitemap,
  isPublicPathEnabled,
  isTravelModulePathEnabled,
} from "@/lib/public-module-visibility";

describe("public module visibility", () => {
  it("blocks an entire disabled module subtree but keeps admin operations available", () => {
    const navigation = { ...DEFAULT_SITE_NAVIGATION, showJournal: false };

    expect(isPublicPathEnabled("/blog", navigation)).toBe(false);
    expect(isPublicPathEnabled("/blog/example", navigation)).toBe(false);
    expect(isPublicPathEnabled("/admin/content/documents", navigation)).toBe(true);
  });

  it("controls destinations and places independently under geography", () => {
    const navigation = { ...DEFAULT_SITE_NAVIGATION, showDestinations: false };

    expect(isPublicPathEnabled("/destinations/patagonia", navigation)).toBe(false);
    expect(isPublicPathEnabled("/places/perito-moreno", navigation)).toBe(true);
    const geography = filterSiteNavSections(SITE_NAV_SECTIONS, navigation).find(
      (section) => section.id === "geography",
    );
    expect(geography?.href).toBe("/places");
    expect(
      geography?.columns?.flatMap((column) => column.links).some((link) =>
        link.href.startsWith("/destinations"),
      ),
    ).toBe(false);
  });

  it("can hide places while keeping destinations and removes geography when both are off", () => {
    const destinationsOnly = { ...DEFAULT_SITE_NAVIGATION, showPlaces: false };

    expect(isPublicPathEnabled("/destinations/mendoza", destinationsOnly)).toBe(true);
    expect(isPublicPathEnabled("/places/aconcagua", destinationsOnly)).toBe(false);
    expect(isPublicPathEnabled("/collections/wine", destinationsOnly)).toBe(false);
    expect(isPublicPathEnabled("/mapa-argentina", destinationsOnly)).toBe(false);
    expect(
      filterSiteNavSections(SITE_NAV_SECTIONS, destinationsOnly).find(
        (section) => section.id === "geography",
      )?.href,
    ).toBe("/destinations");

    const geographyOff = {
      ...DEFAULT_SITE_NAVIGATION,
      showDestinations: false,
      showPlaces: false,
    };
    expect(
      filterSiteNavSections(SITE_NAV_SECTIONS, geographyOff).some(
        (section) => section.id === "geography",
      ),
    ).toBe(false);
  });

  it("gates car-rental and transfer route subtrees by their travel modes", () => {
    const modules = {
      ...DEFAULT_SITE_MODULES,
      carRentalMode: "disabled" as const,
      transfersMode: "disabled" as const,
    };

    expect(isTravelModulePathEnabled("/car-rental", modules)).toBe(false);
    expect(isTravelModulePathEnabled("/car-rental/partner", modules)).toBe(false);
    expect(isTravelModulePathEnabled("/transfers", modules)).toBe(false);
    expect(isTravelModulePathEnabled("/transfers/airport", modules)).toBe(false);
    expect(isTravelModulePathEnabled("/apartments", modules)).toBe(false);
    expect(isTravelModulePathEnabled("/services", modules)).toBe(true);
    expect(isPublicPathIncludedInSearch("/transfers?from=eze", DEFAULT_SITE_NAVIGATION, modules)).toBe(false);
    expect(isPublicPathIncludedInSitemap("/transfers", DEFAULT_SITE_NAVIGATION, modules)).toBe(false);
    expect(isPublicPathIncludedInSearch("/car-rental", DEFAULT_SITE_NAVIGATION, modules)).toBe(false);
  });

  it("separates route publication, menu visibility, search and sitemap", () => {
    const navigation = { ...DEFAULT_SITE_NAVIGATION, showImmigration: false };
    const modules = {
      ...DEFAULT_SITE_MODULES,
      publicModules: {
        ...DEFAULT_SITE_MODULES.publicModules,
        immigration: {
          activated: true,
          published: true,
          includeInSearch: false,
          includeInSitemap: true,
        },
      },
    };

    expect(isPublicPathEnabled("/immigration", navigation, modules)).toBe(true);
    expect(isPublicLinkEnabled("/immigration", navigation, modules)).toBe(false);
    expect(isPublicPathIncludedInSearch("/immigration", navigation, modules)).toBe(false);
    expect(isPublicPathIncludedInSitemap("/immigration", navigation, modules)).toBe(true);
  });

  it("closes a public URL and discovery when its module is deactivated", () => {
    const modules = {
      ...DEFAULT_SITE_MODULES,
      publicModules: {
        ...DEFAULT_SITE_MODULES.publicModules,
        immigration: {
          ...DEFAULT_SITE_MODULES.publicModules.immigration,
          activated: false,
        },
      },
    };

    expect(isPublicPathEnabled("/immigration", DEFAULT_SITE_NAVIGATION, modules)).toBe(false);
    expect(isPublicPathIncludedInSitemap("/immigration", DEFAULT_SITE_NAVIGATION, modules)).toBe(false);
  });

  it("indexes apartment routes only for the real native request mode", () => {
    expect(isTravelModulePathEnabled("/apartments/palermo-loft", { ...DEFAULT_SITE_MODULES, apartmentsMode: "request" })).toBe(false);
    expect(isTravelModulePathEnabled("/apartments/palermo-loft", { ...DEFAULT_SITE_MODULES, apartmentsMode: "native_request" })).toBe(true);
  });

  it("filters nested service navigation using travel module availability", () => {
    const modules = {
      ...DEFAULT_SITE_MODULES,
      carRentalMode: "disabled" as const,
      transfersMode: "disabled" as const,
    };
    const services = filterSiteNavSections(
      SITE_NAV_SECTIONS,
      DEFAULT_SITE_NAVIGATION,
      modules,
    ).find((section) => section.id === "services");
    const hrefs = services?.columns?.flatMap((column) =>
      column.links.map((link) => link.href),
    );

    expect(hrefs).not.toContain("/car-rental");
    expect(hrefs?.some((href) => href.startsWith("/transfers"))).toBe(false);
    expect(hrefs).toContain("/insurance");
  });

  it("filters arbitrary internal links by navigation and travel modules", () => {
    const navigation = { ...DEFAULT_SITE_NAVIGATION, showTours: false };
    const modules = { ...DEFAULT_SITE_MODULES, transfersMode: "disabled" as const };
    const links = [
      { id: "tours", href: "/tours?from=utility" },
      { id: "transfer", href: "/transfers#search" },
      { id: "insurance", href: "/insurance" },
      { id: "partner", href: "https://partner.example/tours" },
      { id: "email", href: "mailto:hello@goargentina.ru" },
    ];

    expect(filterPublicLinks(links, navigation, modules).map((link) => link.id)).toEqual([
      "insurance",
      "partner",
      "email",
    ]);
    expect(isPublicLinkEnabled("/tours#catalog", navigation, modules)).toBe(false);
    expect(isPublicLinkEnabled("https://partner.example/tours", navigation, modules)).toBe(true);
  });

  it("removes disabled module URLs from sitemap candidates", () => {
    const navigation = {
      ...DEFAULT_SITE_NAVIGATION,
      showShop: false,
      showForum: false,
      showKnowledgeBase: false,
    };

    expect(
      filterPublicPaths(
        ["/", "/shop", "/shop/guide", "/forum/topic", "/baza-znaniy/test", "/faq"],
        navigation,
      ),
    ).toEqual(["/", "/faq"]);
  });

  it("can remove disabled travel paths from public path candidates", () => {
    const modules = { ...DEFAULT_SITE_MODULES, carRentalMode: "disabled" as const };

    expect(
      filterPublicPaths(
        ["/services", "/car-rental", "/transfers", "/insurance"],
        DEFAULT_SITE_NAVIGATION,
        modules,
      ),
    ).toEqual(["/services", "/transfers", "/insurance"]);
  });

  it("removes a disabled forum from navigation", () => {
    const navigation = { ...DEFAULT_SITE_NAVIGATION, showForum: false };
    expect(
      filterSiteNavSections(SITE_NAV_SECTIONS, navigation).some(
        (section) => section.id === "community",
      ),
    ).toBe(false);
  });
});
