import { describe, expect, it } from "vitest";
import { normalizeBlogBodyBlock } from "@/lib/cms/page-builder/block-normalize";
import { PAGE_BUILDER_BLOCKS, createPageBuilderBlock } from "@/lib/cms/page-builder/block-registry";
import { createPageBuilderPattern } from "@/lib/cms/page-builder/pattern-registry";
import { destinationPageFromCms, placeDetailFromCms } from "@/types/cms-content";
import type { CmsDocument } from "@/types/cms-content";

describe("sitewide page builder blocks", () => {
  it("includes travel widgets and layout blocks in picker", () => {
    const slugs = new Set(PAGE_BUILDER_BLOCKS.map((block) => block.slug));
    expect(slugs.has("season-matrix")).toBe(true);
    expect(slugs.has("tourism-timeline")).toBe(true);
    expect(slugs.has("hero-banner")).toBe(true);
    expect(slugs.has("related-links")).toBe(true);
    expect(slugs.has("hub-cta-row")).toBe(true);
  });

  it("normalizes hero-banner and hub-cta-row", () => {
    expect(
      normalizeBlogBodyBlock({
        type: "hero-banner",
        title: "Патагония",
        primaryCta: { label: "Туры", href: "/tours" },
      }),
    ).toMatchObject({ type: "hero-banner", title: "Патагония" });

    expect(
      normalizeBlogBodyBlock({
        type: "hub-cta-row",
        items: [{ label: "Карта", href: "/mapa-argentina" }],
      }),
    ).toMatchObject({ type: "hub-cta-row" });
  });

  it("creates non-blog patterns with supported blocks", () => {
    for (const slug of [
      "destination-page-body",
      "place-practical",
      "immigration-practical",
      "hub-intro",
    ] as const) {
      const blocks = createPageBuilderPattern(slug);
      expect(blocks.length).toBeGreaterThan(1);
      for (const block of blocks) {
        expect(normalizeBlogBodyBlock(block)).not.toBeNull();
      }
    }
  });

  it("maps destination/place CMS sections to public models", () => {
    const base = {
      id: "1",
      slug: "ba",
      locale: "ru",
      title: "Буэнос-Айрес",
      status: "published" as const,
      seo: {},
      publishedAt: "2026-07-01T00:00:00.000Z",
      scheduledPublishAt: null,
      createdBy: null,
      updatedBy: null,
      rowVersion: 1,
      createdAt: "2026-07-01T00:00:00.000Z",
      updatedAt: "2026-07-01T00:00:00.000Z",
    };

    const destination = destinationPageFromCms({
      ...base,
      docType: "destination",
      body: {
        kind: "destination",
        description: "Столица",
        sections: [
          {
            heading: "Практика",
            blocks: [createPageBuilderBlock("checklist")],
          },
        ],
      },
    } as CmsDocument);

    expect(destination?.sections?.[0]?.heading).toBe("Практика");
    expect(destination?.sections?.[0]?.blocks?.[0]?.type).toBe("checklist");

    const place = placeDetailFromCms({
      ...base,
      docType: "place",
      slug: "iguazu-falls",
      title: "Игуасу",
      body: {
        kind: "place",
        shortDescription: "Водопады",
        fullDescription: "Полное описание",
        sections: [
          {
            heading: "Как добраться",
            blocks: [createPageBuilderBlock("steps")],
          },
        ],
      },
    } as CmsDocument);

    expect(place?.sections?.[0]?.blocks?.[0]?.type).toBe("steps");
  });
});
