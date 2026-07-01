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

const ABOUT_KEYS = [
  "about.meta.title",
  "about.meta.description",
  "about.hero.title",
  "about.hero.subtitle",
  "about.story.title",
  "about.value.travelers.title",
  "about.explore.title",
  "about.cta.title",
] as const;

const CONTACTS_KEYS = [
  "contacts.meta.title",
  "contacts.meta.description",
  "contacts.hero.title",
  "contacts.hero.subtitle",
  "contacts.form.title",
  "contacts.form.defaultIntro",
  "contacts.find.title",
  "contacts.messengers.title",
  "contacts.email.title",
  "contacts.office.title",
] as const;

function expectKeysResolved(locale: "ru" | "en" | "es", keys: readonly string[]) {
  const messages = getSyncMessages(locale);
  for (const key of keys) {
    const value = t(messages, key, key);
    expect(value, `${locale}:${key}`).not.toBe(key);
    expect(value.length, `${locale}:${key}`).toBeGreaterThan(0);
  }
}

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

  it("resolves about page keys for en and es", () => {
    expectKeysResolved("en", ABOUT_KEYS);
    expectKeysResolved("es", ABOUT_KEYS);
  });

  it("resolves contacts page keys for en and es", () => {
    expectKeysResolved("en", CONTACTS_KEYS);
    expectKeysResolved("es", CONTACTS_KEYS);
  });
});
