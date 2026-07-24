import { describe, expect, it } from "vitest";
import {
  createSettingsConfirmationToken,
  detectDangerousSettingsChanges,
  settingsConfirmationMatches,
} from "@/lib/admin/settings-control";
import { DEFAULT_SITE_MODULES } from "@/lib/cms/site-globals/normalize";

describe("admin settings control plane", () => {
  it("requires explicit acknowledgement for operational shutdowns", () => {
    const updates = [
      {
        key: "site.navigation" as const,
        expectedVersion: 4,
        value: { showBlog: true, showForum: false, showShop: false },
      },
      {
        key: "site.features" as const,
        expectedVersion: 2,
        value: { maintenanceMode: true, allowOrganizerSignup: true },
      },
    ];
    const risks = detectDangerousSettingsChanges(
      {
        "site.navigation": { showBlog: true, showForum: true, showShop: true },
        "site.features": { maintenanceMode: false, allowOrganizerSignup: true },
      },
      updates,
    );

    expect(risks.map((risk) => risk.id)).toEqual([
      "site.features:maintenanceMode:on",
      "site.navigation:showForum:off",
      "site.navigation:showShop:off",
    ]);
  });

  it("does not demand confirmation for ordinary editorial changes", () => {
    expect(
      detectDangerousSettingsChanges(
        { "site.branding": { siteName: "До" } },
        [{ key: "site.branding", expectedVersion: 1, value: { siteName: "После" } }],
      ),
    ).toEqual([]);
  });

  it("requires confirmation before a public module is disabled", () => {
    const previousModules = {
      ...DEFAULT_SITE_MODULES,
      publicModules: {
        ...DEFAULT_SITE_MODULES.publicModules,
        immigration: {
          ...DEFAULT_SITE_MODULES.publicModules.immigration,
          activated: true,
          published: true,
          includeInSearch: true,
          includeInSitemap: true,
        },
      },
    };
    const nextModules = {
      ...previousModules,
      publicModules: {
        ...previousModules.publicModules,
        immigration: {
          ...previousModules.publicModules.immigration,
          activated: false,
        },
      },
    };
    const risks = detectDangerousSettingsChanges(
      { "site.modules": previousModules },
      [{ key: "site.modules", value: nextModules, expectedVersion: 1 }],
    );

    expect(risks.map((risk) => risk.id)).toContain(
      "site.modules:publicModules:immigration:off",
    );
  });

  it("binds a confirmation token to values, versions and risks", () => {
    const updates = [
      { key: "site.seo" as const, expectedVersion: 3, value: { allowIndexing: false } },
    ];
    const risks = detectDangerousSettingsChanges(
      { "site.seo": { allowIndexing: true } },
      updates,
    );
    const token = createSettingsConfirmationToken(updates, risks);

    expect(settingsConfirmationMatches(token, token)).toBe(true);
    expect(
      settingsConfirmationMatches(
        token,
        createSettingsConfirmationToken(
          [{ ...updates[0], expectedVersion: 4 }],
          risks,
        ),
      ),
    ).toBe(false);
  });
});
