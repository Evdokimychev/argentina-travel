import { describe, expect, it } from "vitest";
import {
  buildPublicPageMetadata,
  normalizeSeoDescription,
  normalizeSeoTitle,
  SEO_DESCRIPTION_MAX_LENGTH,
  SEO_TITLE_MAX_LENGTH,
} from "@/lib/page-metadata";

describe("public page metadata", () => {
  it("keeps search titles and descriptions within safe limits", () => {
    const title = normalizeSeoTitle("Очень длинный заголовок страницы ".repeat(5));
    const description = normalizeSeoDescription("Подробное описание путешествия по Аргентине. ".repeat(10));

    expect(title.length).toBeLessThanOrEqual(SEO_TITLE_MAX_LENGTH);
    expect(description.length).toBeLessThanOrEqual(SEO_DESCRIPTION_MAX_LENGTH);
    expect(title.endsWith("…")).toBe(true);
    expect(description.endsWith("…")).toBe(true);
  });

  it("uses the normalized title consistently without a global suffix", () => {
    const metadata = buildPublicPageMetadata({
      title: "Экскурсии по Аргентине",
      description: "Авторские экскурсии, прогулки и активности по всей Аргентине.",
      path: "/excursions",
    });

    expect(metadata.title).toEqual({ absolute: "Экскурсии по Аргентине" });
    expect(metadata.openGraph?.title).toBe("Экскурсии по Аргентине");
    expect(metadata.openGraph?.images).toBeTruthy();
  });

  it("adds the brand only when a title is too short to be descriptive", () => {
    expect(normalizeSeoTitle("О проекте")).toBe("О проекте | Пора в Аргентину");
    expect(normalizeSeoTitle("Экскурсии по Аргентине")).toBe("Экскурсии по Аргентине");
  });
});
