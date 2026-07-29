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
});
