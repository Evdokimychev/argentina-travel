import { afterEach, describe, expect, it, vi } from "vitest";

import { CmsPublicContentUnavailableError } from "@/lib/cms/public-read-result";

const {
  resolveGuidePage,
  resolveGuideTopic,
  getGuideTopicMetadata,
  getContentPage,
  buildCmsContentHreflangAlternates,
} = vi.hoisted(() => ({
  resolveGuidePage: vi.fn(),
  resolveGuideTopic: vi.fn(),
  getGuideTopicMetadata: vi.fn(),
  getContentPage: vi.fn(),
  buildCmsContentHreflangAlternates: vi.fn(),
}));

vi.mock("@/lib/cms/guide-resolver", () => ({
  resolveGuidePage,
  resolveGuideTopic,
}));

vi.mock("@/lib/guide-topics", () => ({
  getGuideTopicMetadata,
}));

vi.mock("@/lib/content-pages", () => ({
  getContentPage,
}));

vi.mock("@/lib/cms/cms-hreflang", () => ({
  buildCmsContentHreflangAlternates,
}));

vi.mock("@/lib/media-resolver", () => ({
  getGuideTopicHeroImage: () => "/media/places/buenos-aires/hero.jpg",
}));

vi.mock("@/lib/i18n/hreflang", () => ({
  buildHreflangAlternates: (path: string) => ({ canonical: path }),
}));

vi.mock("@/data/guide-hub-kak-dobratsya", () => ({
  KAK_DOBRATSYA_HUB: {
    heroTitle: "Как добраться",
    heroSubtitle: "Перелёты и трансферы",
  },
}));

import { buildGuideSlugPageMetadata } from "./guide-slug-metadata";

function absoluteTitle(metadata: Awaited<ReturnType<typeof buildGuideSlugPageMetadata>>): string {
  const title = metadata.title;
  if (typeof title === "string") return title;
  if (title && typeof title === "object" && "absolute" in title && typeof title.absolute === "string") {
    return title.absolute;
  }
  throw new Error("expected metadata.title");
}

describe("buildGuideSlugPageMetadata", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    resolveGuidePage.mockReset();
    resolveGuideTopic.mockReset();
    getGuideTopicMetadata.mockReset();
    getContentPage.mockReset();
    buildCmsContentHreflangAlternates.mockReset();
  });

  it("keeps a title for CMS-only guide slugs when the DB is down", async () => {
    getGuideTopicMetadata.mockReturnValue(undefined);
    getContentPage.mockReturnValue(undefined);
    resolveGuidePage.mockRejectedValue(new CmsPublicContentUnavailableError("db_unavailable"));

    const metadata = await buildGuideSlugPageMetadata("buenos-aires", "ru");

    expect(absoluteTitle(metadata)).toContain("Путеводитель");
    expect(metadata.robots).toEqual({ index: false, follow: true });
  });

  it("falls back to the static guide file page when CMS detail is unavailable", async () => {
    getGuideTopicMetadata.mockReturnValue(undefined);
    getContentPage.mockReturnValue({
      slug: "sezony-i-klimat",
      title: "Сезоны и климат в Аргентине",
      description: "Когда ехать: регионы и месяцы.",
      section: "guide",
      sections: [],
    });
    resolveGuidePage.mockRejectedValue(new CmsPublicContentUnavailableError("quota"));

    const metadata = await buildGuideSlugPageMetadata("sezony-i-klimat", "ru");

    expect(absoluteTitle(metadata)).toContain("Сезоны и климат в Аргентине");
  });

  it("uses getGuideTopicMetadata when resolveGuideTopic soft-fails", async () => {
    getGuideTopicMetadata.mockReturnValue({
      title: "Где жить в Аргентине — районы, отели и договор аренды",
      description: "Районы BA и варианты жилья.",
    });
    resolveGuideTopic.mockRejectedValue(new Error("unexpected topic failure"));

    const metadata = await buildGuideSlugPageMetadata("gde-zhit", "ru");

    expect(absoluteTitle(metadata)).toContain("Где жить в Аргентине");
  });

  it("does not swallow unexpected non-CMS failures on article pages", async () => {
    getGuideTopicMetadata.mockReturnValue(undefined);
    getContentPage.mockReturnValue(undefined);
    resolveGuidePage.mockRejectedValue(new Error("invalid guide document"));

    await expect(buildGuideSlugPageMetadata("buenos-aires", "ru")).rejects.toThrow(
      "invalid guide document",
    );
  });
});
