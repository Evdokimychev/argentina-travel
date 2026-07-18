import { describe, expect, it } from "vitest";
import { buildCmsPageMetadata } from "@/lib/cms/cms-page-metadata";
import {
  attachCmsResolverMetadata,
  buildCmsResolverMetadata,
} from "@/lib/cms/content-resolver";
import { buildDefaultTranslationStatus } from "@/lib/cms/translation-status";

describe("buildCmsPageMetadata", () => {
  it("applies CMS SEO fields to canonical, robots and social cards", () => {
    const content = attachCmsResolverMetadata(
      { slug: "iguazu" },
      buildCmsResolverMetadata("ru", buildDefaultTranslationStatus(true), {
        title: "Водопады Игуасу — путеводитель",
        description: "Как добраться до водопадов Игуасу и спланировать посещение парка.",
        canonical: "/places/iguazu",
        image: "/media/places/iguazu/hero.jpg",
        noIndex: true,
      }),
    );

    const metadata = buildCmsPageMetadata({
      content,
      title: "Игуасу",
      description: "Описание по умолчанию",
      path: "/guide/iguazu",
      alternates: { languages: { ru: "/guide/iguazu" } },
    });

    expect(metadata.title).toEqual({ absolute: "Водопады Игуасу — путеводитель" });
    expect(metadata.description).toContain("Как добраться");
    expect(metadata.alternates?.canonical).toBe("https://www.goargentina.ru/places/iguazu");
    expect(metadata.alternates?.languages).toEqual({ ru: "/guide/iguazu" });
    expect(metadata.robots).toEqual({ index: false, follow: true });
    expect(metadata.openGraph?.images).toEqual([
      {
        url: "https://www.goargentina.ru/media/places/iguazu/hero.jpg",
        alt: "Водопады Игуасу — путеводитель",
      },
    ]);
    expect(metadata.twitter?.images).toEqual([
      "https://www.goargentina.ru/media/places/iguazu/hero.jpg",
    ]);
  });

  it("uses the route fallback when a legacy CMS description is too short", () => {
    const content = attachCmsResolverMetadata(
      { slug: "patagonia" },
      buildCmsResolverMetadata("ru", buildDefaultTranslationStatus(true), {
        description: "Короткое описание.",
      }),
    );

    const metadata = buildCmsPageMetadata({
      content,
      title: "Патагония",
      description:
        "Путеводитель по Патагонии: маршруты, сезоны, транспорт и главные природные места региона.",
      path: "/destinations/patagonia",
    });

    expect(metadata.description).toContain("Путеводитель по Патагонии");
  });
});
