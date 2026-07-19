import { describe, expect, it } from "vitest";
import { resolveKbMediaImages } from "./media";
import { getPlaceGalleryMedia } from "@/lib/media-resolver";

describe("knowledge-base media gallery", () => {
  it("keeps the hero first and removes duplicate gallery URLs", () => {
    const images = resolveKbMediaImages({
      hero: { url: "/media/hero.jpg", alt: "Главное фото" },
      gallery: [
        { url: "/media/hero.jpg", alt: "Повтор" },
        { url: "/media/detail.jpg", alt: "Деталь" },
      ],
    });

    expect(images.map((image) => image.url)).toEqual([
      "/media/hero.jpg",
      "/media/detail.jpg",
    ]);
    expect(images[0]?.alt).toBe("Главное фото");
  });

  it("uses bundled place media instead of remote hotlinks", () => {
    const images = getPlaceGalleryMedia("buenos-aires");

    expect(images.length).toBeGreaterThan(1);
    expect(images.every((image) => image.src.startsWith("/media/places/buenos-aires/"))).toBe(true);
    expect(images.every((image) => Boolean(image.license))).toBe(true);
  });
});
