import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getSyncMessages } from "@/lib/i18n/sync-messages";
import type { LocaleCode } from "@/types/locale";

const PUBLIC_PRODUCT_TRUTH_KEYS = [
  "nav.utility.tours",
  "home.hero.eyebrow",
  "home.hero.subtitle",
  "footer.description",
  "footer.marketplaceTag",
  "about.meta.description",
  "about.hero.title",
  "about.hero.subtitle",
  "about.story.p1",
  "about.story.p2",
  "about.value.travelers.text",
  "about.value.trust.text",
] as const;

const UNSUPPORTED_GLOBAL_CLAIMS = [
  /marketplace|маркетплейс/iu,
  /verified (?:route|organizer)|trusted organizer|проверенн(?:ый|ые|ых|ыми) организатор/iu,
  /organizadores? (?:verificados?|de confianza)/iu,
  /book directly|бронируйте напрямую|reserva directamente/iu,
  /real reviews|реальн(?:ые|ыми) отзыв|reseñas reales|avaliações reais/iu,
  /no prepayment|без предоплат|sin prepago/iu,
] as const;

const PUBLIC_COPY_SOURCES = [
  "src/components/about/DesignSystemShowcase.tsx",
  "src/components/marketplace/MarketplaceHome.tsx",
  "src/data/guide-content.ts",
  "src/data/guide-pillar-bezopasnost.ts",
  "src/data/site-nav.ts",
] as const;

const UNSUPPORTED_SOURCE_PHRASES = [
  /Проверенные организаторы/u,
  /Каждый гид проходит отбор/u,
  /Оплата без предоплаты/u,
  /Бронируйте лучшие туры/u,
  /маркетплейс авторских туров/iu,
  /экскурсии с проверенными организаторами/iu,
  /только реальные отзывы после поездок/iu,
] as const;

function publicProductTruthCopy(locale: LocaleCode): string {
  const messages = getSyncMessages(locale);
  return PUBLIC_PRODUCT_TRUTH_KEYS.map((key) => messages[key] ?? "").join("\n");
}

describe("public product-truth copy", () => {
  it.each<LocaleCode>(["ru", "en", "es", "pt"])(
    "%s does not make global marketplace, verification, or booking claims",
    (locale) => {
      const copy = publicProductTruthCopy(locale);

      for (const unsupportedClaim of UNSUPPORTED_GLOBAL_CLAIMS) {
        expect(copy).not.toMatch(unsupportedClaim);
      }
    }
  );

  it.each([
    ["ru", /партнёру[\s\S]*заявк/iu],
    ["en", /partner[\s\S]*request/iu],
    ["es", /socio[\s\S]*solicitud/iu],
    ["pt", /partner[\s\S]*request/iu],
  ] as const)("%s footer distinguishes partner handoff from a request", (locale, contract) => {
    expect(getSyncMessages(locale)["footer.description"]).toMatch(contract);
  });

  it("keeps high-risk public copy sources free of unsupported global promises", () => {
    const source = PUBLIC_COPY_SOURCES.map((file) =>
      fs.readFileSync(path.join(process.cwd(), file), "utf8")
    ).join("\n");

    for (const unsupportedPhrase of UNSUPPORTED_SOURCE_PHRASES) {
      expect(source).not.toMatch(unsupportedPhrase);
    }
  });
});
