import { describe, expect, it } from "vitest";
import {
  DEFAULT_SITE_BRANDING,
  DEFAULT_SITE_CONTACT,
  DEFAULT_SITE_MAINTENANCE,
} from "@/lib/cms/site-globals/normalize";
import { normalizeSiteBranding, normalizeSiteContact, normalizeSiteMaintenance } from "@/lib/cms/site-globals/normalize";
import { resolveMaintenancePageViewModel } from "@/lib/maintenance-page";

describe("resolveMaintenancePageViewModel with draft values", () => {
  it("normalizes partial maintenance globals before building preview model", () => {
    const model = resolveMaintenancePageViewModel({
      maintenance: normalizeSiteMaintenance({
        headline: "Скоро откроемся",
        message: "Готовим новый каталог",
        countdownEnabled: true,
        countdownTarget: "2026-08-01T10:00:00.000Z",
      }),
      branding: normalizeSiteBranding({
        siteName: "Тестовый портал",
        tagline: "Аргентина",
      }),
      contact: normalizeSiteContact({
        supportEmail: "hello@example.com",
        telegramUrl: "https://t.me/test",
      }),
    });

    expect(model.headline).toBe("Скоро откроемся");
    expect(model.message).toBe("Готовим новый каталог");
    expect(model.siteName).toBe("Тестовый портал");
    expect(model.supportEmail).toBe("hello@example.com");
    expect(model.countdownEnabled).toBe(true);
    expect(model.countdownTarget).toBe("2026-08-01T10:00:00.000Z");
    expect(model.countdownTargetDate).toBeInstanceOf(Date);
  });

  it("falls back to defaults for empty draft fields", () => {
    const model = resolveMaintenancePageViewModel({
      maintenance: normalizeSiteMaintenance(undefined),
      branding: normalizeSiteBranding(undefined),
      contact: normalizeSiteContact(undefined),
    });

    expect(model.badgeLabel).toBe(DEFAULT_SITE_MAINTENANCE.badgeLabel);
    expect(model.siteName).toBe(DEFAULT_SITE_BRANDING.siteName);
    expect(model.supportEmail).toBe(DEFAULT_SITE_CONTACT.supportEmail);
    expect(model.countdownEnabled).toBe(false);
  });
});
