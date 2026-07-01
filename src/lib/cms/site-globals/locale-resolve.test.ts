import { describe, expect, it } from "vitest";
import { resolveSiteGlobalForLocale } from "@/lib/cms/site-globals/locale-resolve";

describe("resolveSiteGlobalForLocale", () => {
  const base = {
    tagline: "путешествия по Аргентине",
    defaultTitle: "Пора в Аргентину — путешествия по Аргентине",
    siteName: "Пора в Аргентину",
  };

  const locales = {
    en: {
      tagline: "travel in Argentina",
      defaultTitle: "Go Argentina — travel in Argentina",
    },
    es: {
      tagline: "viajes por Argentina",
    },
  };

  it("returns base for ru locale", () => {
    expect(resolveSiteGlobalForLocale(base, locales, "ru")).toEqual(base);
  });

  it("merges en overrides onto base", () => {
    expect(resolveSiteGlobalForLocale(base, locales, "en")).toEqual({
      siteName: "Пора в Аргентину",
      tagline: "travel in Argentina",
      defaultTitle: "Go Argentina — travel in Argentina",
    });
  });

  it("falls back to base when es override is partial", () => {
    expect(resolveSiteGlobalForLocale(base, locales, "es")).toEqual({
      siteName: "Пора в Аргентину",
      tagline: "viajes por Argentina",
      defaultTitle: "Пора в Аргентину — путешествия по Аргентине",
    });
  });

  it("returns base when locales object is missing", () => {
    expect(resolveSiteGlobalForLocale(base, undefined, "en")).toEqual(base);
  });

  it("returns base when requested locale has no entry", () => {
    expect(resolveSiteGlobalForLocale(base, { en: { tagline: "x" } }, "es")).toEqual(base);
  });
});
