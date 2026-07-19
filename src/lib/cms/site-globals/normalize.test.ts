import { describe, expect, it } from "vitest";
import {
  DEFAULT_SITE_BRANDING,
  DEFAULT_SITE_CONTACT,
  DEFAULT_SITE_DESIGN,
  DEFAULT_SITE_FEATURES,
  DEFAULT_SITE_FORMS,
  DEFAULT_SITE_EMAIL,
  DEFAULT_SITE_MARKETING,
  DEFAULT_SITE_LEGAL_LOCALES,
  DEFAULT_SITE_MAINTENANCE,
  DEFAULT_SITE_MODULES,
  DEFAULT_SITE_NAVIGATION,
  DEFAULT_SITE_SEO,
  normalizeSiteBranding,
  normalizeSiteContact,
  normalizeSiteDesign,
  normalizeSiteFeatures,
  normalizeSiteForms,
  normalizeSiteEmail,
  normalizeSiteMarketing,
  normalizeSiteGlobalByKey,
  normalizeSiteLegal,
  normalizeSiteMaintenance,
  normalizeSiteModules,
  normalizeSiteNavigation,
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

describe("normalizeSiteNavigation", () => {
  it("uses defaults and supports hiding a public section", () => {
    expect(normalizeSiteNavigation(undefined)).toEqual(DEFAULT_SITE_NAVIGATION);
    expect(normalizeSiteNavigation({ showShop: false }).showShop).toBe(false);
  });

  it("rejects unsafe utility links", () => {
    expect(normalizeSiteNavigation({ utilityContactUrl: "javascript:alert(1)" }).utilityContactUrl)
      .toBe(DEFAULT_SITE_NAVIGATION.utilityContactUrl);
  });
});

describe("normalizeSiteDesign", () => {
  it("uses defaults for invalid input", () => {
    expect(normalizeSiteDesign(undefined)).toEqual(DEFAULT_SITE_DESIGN);
    expect(normalizeSiteDesign([])).toEqual(DEFAULT_SITE_DESIGN);
    expect(DEFAULT_SITE_DESIGN.showUtilityBar).toBe(false);
  });

  it("accepts only supported presets and variants", () => {
    expect(
      normalizeSiteDesign({
        palettePreset: "wine",
        headingFont: "serif",
        headerVariant: "compact",
        footerVariant: "mist",
      }),
    ).toMatchObject({
      palettePreset: "wine",
      headingFont: "serif",
      headerVariant: "compact",
      footerVariant: "mist",
    });

    expect(
      normalizeSiteDesign({
        palettePreset: "custom",
        headingFont: "comic-sans",
        headerVariant: "full-screen",
        footerVariant: "dark",
      }),
    ).toMatchObject({
      palettePreset: DEFAULT_SITE_DESIGN.palettePreset,
      headingFont: DEFAULT_SITE_DESIGN.headingFont,
      headerVariant: DEFAULT_SITE_DESIGN.headerVariant,
      footerVariant: DEFAULT_SITE_DESIGN.footerVariant,
    });
  });

  it("keeps explicit booleans and drops unknown fields", () => {
    expect(
      normalizeSiteDesign({
        showUtilityBar: false,
        showHeaderMapButton: false,
        showThemeToggle: false,
        showFooterNewsletter: false,
        showFooterRouteCta: false,
        unknownCssColor: "#ff00ff",
      }),
    ).toEqual({
      ...DEFAULT_SITE_DESIGN,
      showUtilityBar: false,
      showHeaderMapButton: false,
      showThemeToggle: false,
      showFooterNewsletter: false,
      showFooterRouteCta: false,
    });
  });
});

describe("normalizeSiteModules", () => {
  it("uses safe product defaults for invalid input", () => {
    expect(normalizeSiteModules(undefined)).toEqual(DEFAULT_SITE_MODULES);
    expect(normalizeSiteModules([])).toEqual(DEFAULT_SITE_MODULES);
  });

  it("accepts supported modes and visibility switches", () => {
    expect(
      normalizeSiteModules({
        apartmentsMode: "native_request",
        carRentalMode: "preparing_hybrid",
        transfersMode: "request",
        hotelsMode: "disabled",
        showApartmentsInServices: false,
        showCarRentalInServices: false,
        showTransfersInServices: true,
      }),
    ).toEqual({
      apartmentsMode: "native_request",
      carRentalMode: "preparing_hybrid",
      transfersMode: "request",
      hotelsMode: "disabled",
      showApartmentsInServices: false,
      showCarRentalInServices: false,
      showTransfersInServices: true,
    });
  });

  it("rejects unsupported modes without enabling unfinished products", () => {
    expect(
      normalizeSiteModules({
        apartmentsMode: "instant_checkout",
        carRentalMode: "native",
        transfersMode: "native",
        hotelsMode: "booking",
      }),
    ).toMatchObject({
      apartmentsMode: DEFAULT_SITE_MODULES.apartmentsMode,
      carRentalMode: DEFAULT_SITE_MODULES.carRentalMode,
      transfersMode: DEFAULT_SITE_MODULES.transfersMode,
      hotelsMode: DEFAULT_SITE_MODULES.hotelsMode,
    });
  });
});

describe("communications globals", () => {
  it("normalizes form protection without accepting unsupported modes", () => {
    expect(normalizeSiteForms(undefined)).toEqual(DEFAULT_SITE_FORMS);
    expect(
      normalizeSiteForms({
        contactEnabled: false,
        captchaMode: "custom-provider",
        captchaShopOrder: false,
      }),
    ).toEqual({
      ...DEFAULT_SITE_FORMS,
      contactEnabled: false,
      captchaShopOrder: false,
    });
  });

  it("normalizes email and marketing values", () => {
    expect(normalizeSiteEmail(undefined)).toEqual(DEFAULT_SITE_EMAIL);
    expect(normalizeSiteMarketing(undefined)).toEqual(DEFAULT_SITE_MARKETING);
    expect(normalizeSiteMarketing({ announcementTone: "neon" }).announcementTone).toBe(
      DEFAULT_SITE_MARKETING.announcementTone,
    );
    expect(
      normalizeSiteEmail({ leadAlertsEnabled: false, replyToEmail: " ops@example.com " }),
    ).toMatchObject({ leadAlertsEnabled: false, replyToEmail: "ops@example.com" });
  });

  it("drops unknown browser fields through the keyed persistence schema", () => {
    expect(
      normalizeSiteGlobalByKey("site.forms", {
        contactEnabled: false,
        captchaMode: "selected",
        injectedSecret: "must-not-persist",
      }),
    ).toEqual({
      ...DEFAULT_SITE_FORMS,
      contactEnabled: false,
      captchaMode: "selected",
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
