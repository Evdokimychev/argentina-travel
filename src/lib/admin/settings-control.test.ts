import { describe, expect, it } from "vitest";
import {
  createSettingsConfirmationToken,
  detectDangerousSettingsChanges,
  settingsConfirmationMatches,
} from "@/lib/admin/settings-control";

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
