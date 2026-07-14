import { describe, expect, it } from "vitest";

import {
  applyGlossaryExport,
  findMixedScriptWords,
  splitTranslationChunks,
} from "../../scripts/lib/argentina-travel-translate.mjs";

describe("Argentina.travel translation glossary", () => {
  it.each([
    ["Latinoamerica", "Latinoamerica"],
    ["Latinoamérica", "Latinoamérica"],
    ["NOA", "Северо-Запад"],
    ["Patagonia", "Патагония"],
    ["Parque Nacional", "национальный парк"],
    ["Perito Moreno", "Перито-Морено"],
    ["Buenos Aires", "Буэнос-Айрес"],
    ["Tierra del Fuego", "Огненная Земля"],
    ["Litoral", "Северо-Восток (Литораль)"],
  ])("applies whole-term replacement to %s", (source, expected) => {
    expect(applyGlossaryExport(source)).toBe(expected);
  });

  it("uses longest matches before shorter place names", () => {
    expect(applyGlossaryExport("Parque Nacional Tierra del Fuego")).toBe(
      "национальный парк Огненная Земля",
    );
  });

  it("does not alter URLs, email addresses or HTML attributes", () => {
    const source = '<a href="https://example.com/NOA/Patagonia">NOA</a> noa@example.com';
    expect(applyGlossaryExport(source)).toBe(
      '<a href="https://example.com/NOA/Patagonia">Северо-Запад</a> noa@example.com',
    );
  });

  it("detects words containing both Latin and Cyrillic scripts", () => {
    expect(findMixedScriptWords("LatiСевероmérica и Патагония")).toEqual(["LatiСевероmérica"]);
  });

  it("splits long text without truncating source content", () => {
    const source = `${"palabra ".repeat(80)}final.`.trim();
    const chunks = splitTranslationChunks(source);
    expect(chunks.every((chunk) => chunk.length <= 450)).toBe(true);
    expect(chunks.join(" ")).toBe(source);
  });
});
