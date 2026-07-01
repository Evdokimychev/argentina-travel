import { describe, expect, it } from "vitest";
import {
  DEFAULT_SITE_BRANDING,
  DEFAULT_SITE_CONTACT,
  DEFAULT_SITE_FEATURES,
  DEFAULT_SITE_LEGAL_LOCALES,
  DEFAULT_SITE_MAINTENANCE,
  DEFAULT_SITE_SEO,
  normalizeSiteBranding,
  normalizeSiteContact,
  normalizeSiteFeatures,
  normalizeSiteLegal,
  normalizeSiteMaintenance,
  normalizeSiteSeo,
  sanitizeGlobalForSave,
} from "@/lib/cms/site-globals/normalize";

describe("normalizeSiteLegal", () => {
  it("returns empty object for invalid input", () => {
    expect(normalizeSiteLegal(null)).toEqual({});
    expect(normalizeSiteLegal([])).toEqual({});
  });

  it("trims string fields and merges default locale overrides", () => {
    expect(
      normalizeSiteLegal({
        companyName: "  ООО Тест  ",
        inn: "123",
        supportEmail: "",
      })
    ).toMatchObject({
      companyName: "  ООО Тест  ",
      inn: "123",
      locales: DEFAULT_SITE_LEGAL_LOCALES,
    });
  });
});

describe("normalizeSiteFeatures", () => {
  it("uses defaults for invalid input", () => {
    expect(normalizeSiteFeatures(undefined)).toEqual(DEFAULT_SITE_FEATURES);
  });

  it("respects maintenanceMode and allowOrganizerSignup", () => {
    expect(
      normalizeSiteFeatures({
        maintenanceMode: true,
        allowOrganizerSignup: false,
      })
    ).toEqual({
      maintenanceMode: true,
      allowOrganizerSignup: false,
      cmsBlogCutover: false,
      cmsGuideCutover: false,
      cmsDestinationCutover: false,
      cmsPlaceCutover: false,
    });
  });

  it("respects cms cutover flags", () => {
    expect(
      normalizeSiteFeatures({
        cmsBlogCutover: true,
        cmsGuideCutover: true,
        cmsDestinationCutover: true,
        cmsPlaceCutover: true,
      })
    ).toMatchObject({
      cmsBlogCutover: true,
      cmsGuideCutover: true,
      cmsDestinationCutover: true,
      cmsPlaceCutover: true,
    });
  });
});

describe("normalizeSiteBranding", () => {
  it("uses defaults for invalid input", () => {
    expect(normalizeSiteBranding(null)).toEqual(DEFAULT_SITE_BRANDING);
  });

  it("merges partial branding", () => {
    expect(normalizeSiteBranding({ siteName: "Новый бренд" })).toMatchObject({
      siteName: "Новый бренд",
      tagline: DEFAULT_SITE_BRANDING.tagline,
    });
  });

  it("parses locales object for branding", () => {
    expect(
      normalizeSiteBranding({
        tagline: "RU слоган",
        locales: {
          en: { tagline: "EN tagline" },
          es: { defaultTitle: "ES title" },
        },
      }),
    ).toMatchObject({
      tagline: "RU слоган",
      locales: {
        en: expect.objectContaining({ tagline: "EN tagline" }),
        es: expect.objectContaining({ defaultTitle: "ES title" }),
      },
    });
  });
});

describe("normalizeSiteSeo", () => {
  it("uses defaults for invalid input", () => {
    expect(normalizeSiteSeo(null)).toEqual(DEFAULT_SITE_SEO);
  });

  it("disables indexing when allowIndexing is false", () => {
    expect(normalizeSiteSeo({ allowIndexing: false }).allowIndexing).toBe(false);
  });
});

describe("normalizeSiteContact", () => {
  it("uses defaults for invalid input", () => {
    expect(normalizeSiteContact(undefined)).toEqual(DEFAULT_SITE_CONTACT);
  });

  it("keeps social urls when provided", () => {
    expect(
      normalizeSiteContact({
        supportEmail: "a@b.c",
        telegramUrl: "https://t.me/test",
      })
    ).toMatchObject({
      supportEmail: "a@b.c",
      telegramUrl: "https://t.me/test",
    });
  });
});

describe("normalizeSiteMaintenance", () => {
  it("uses defaults for invalid input", () => {
    expect(normalizeSiteMaintenance(undefined)).toEqual(DEFAULT_SITE_MAINTENANCE);
  });

  it("merges custom copy and countdown", () => {
    expect(
      normalizeSiteMaintenance({
        headline: "Скоро вернёмся",
        countdownEnabled: true,
        countdownTarget: "2026-08-01T10:00:00.000Z",
      })
    ).toMatchObject({
      headline: "Скоро вернёмся",
      countdownEnabled: true,
      countdownTarget: "2026-08-01T10:00:00.000Z",
      showContacts: true,
    });
  });
});

describe("sanitizeGlobalForSave", () => {
  it("removes empty optional strings but keeps required fields", () => {
    expect(
      sanitizeGlobalForSave({
        siteName: "Бренд",
        supportEmail: "",
        telegramUrl: "   ",
        tagline: "ok",
      })
    ).toEqual({
      siteName: "Бренд",
      supportEmail: "",
      tagline: "ok",
    });
  });

  it("strips empty locale override strings", () => {
    expect(
      sanitizeGlobalForSave({
        tagline: "RU",
        locales: {
          en: { tagline: "  ", defaultTitle: "EN title" },
          es: { tagline: "" },
        },
      }),
    ).toEqual({
      tagline: "RU",
      locales: {
        en: { defaultTitle: "EN title" },
      },
    });
  });
});
