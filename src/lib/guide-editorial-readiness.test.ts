import { describe, expect, it } from "vitest";
import { getGuideEditorialIssues } from "./guide-editorial-readiness";

describe("guide editorial readiness", () => {
  it("blocks fixed prices and unsafe payment shortcuts", () => {
    expect(
      getGuideEditorialIssues("Возьмите $500 и используйте Western Union или cueva."),
    ).toEqual(["fixed_dynamic_price", "unsafe_payment_guidance"]);
  });

  it("requires a primary official link next to immigration or medical guidance", () => {
    expect(getGuideEditorialIssues("Для въезда виза не нужна, страховка обязательна.")).toEqual([
      "sensitive_claims_without_official_source",
    ]);
    expect(
      getGuideEditorialIssues(
        "Правила визы сверяйте в https://www.argentina.gob.ar/interior/migraciones",
      ),
    ).toEqual([]);
  });

  it("blocks public AI and development traces", () => {
    expect(getGuideEditorialIssues("Как языковая модель: TODO: дописать раздел.")).toEqual([
      "ai_trace",
      "development_trace",
    ]);
  });
});
