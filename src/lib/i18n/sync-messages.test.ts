import { describe, expect, it } from "vitest";
import { t } from "@/lib/i18n";
import { getServerSyncMessages, getSyncMessages } from "@/lib/i18n/sync-messages";

const FOOTER_KEYS = [
  "footer.description",
  "footer.navigation",
  "footer.documents",
  "footer.contacts",
  "footer.routeEyebrow",
  "footer.routeTitle",
  "footer.routeBody",
  "footer.routeCta",
  "footer.copyright",
  "footer.support",
  "footer.marketplaceTag",
] as const;

describe("getSyncMessages", () => {
  it("resolves footer chrome keys for default locale", () => {
    const messages = getSyncMessages("ru");
    for (const key of FOOTER_KEYS) {
      const value = t(messages, key, key);
      expect(value).not.toBe(key);
      expect(value.length).toBeGreaterThan(0);
    }
  });

  it("falls back to Russian when locale bundle is missing", () => {
    const messages = getServerSyncMessages();
    expect(t(messages, "footer.navigation", "footer.navigation")).toBe("Навигация");
  });
});
