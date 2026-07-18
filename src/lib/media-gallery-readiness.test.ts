import { describe, expect, it } from "vitest";

import { blogPosts } from "@/data/blog";
import {
  getBlogPostHeroResolved,
  getDestinationGallery,
  getPlaceGallery,
  getRichArticleGallery,
  getTourGallery,
  resolveBlogPostCardImage,
} from "@/lib/media-resolver";
import { filterPublicGalleryImages } from "@/lib/public-gallery-images";

function canonicalMediaPath(src: string): string {
  return new URL(src, "https://www.goargentina.ru").pathname;
}

describe("public media gallery readiness", () => {
  it.each([
    [
      "federacion",
      "1640033244460-6_federacion_parque_acuatico_horizontal__11__alta.jpg",
      "1640033277915-6_federacion_parque_acuatico_horizontal__11__alta.jpg",
    ],
    [
      "gualeguaychu",
      "1638475468881-7_gualeguaychu_playa__andubaysal_horizontal_2_alta.jpg",
      "1638475502902-7_gualeguaychu_playa__andubaysal_horizontal_2_alta.jpg",
    ],
    [
      "parana",
      "1640025681712-3_parana_rio_kite_horizontal__6__alta.jpg",
      "1640025711886-3_parana_rio_kite_horizontal__6__alta.jpg",
    ],
  ])("keeps the place hero and removes its byte-identical gallery copy for %s", (slug, hero, copy) => {
    const gallery = getPlaceGallery(slug);

    expect(gallery).toHaveLength(4);
    expect(gallery.some((src) => src.endsWith(copy))).toBe(false);
    expect(gallery.some((src) => src.endsWith(hero))).toBe(true);
  });

  it("does not repeat the Mendoza hero source inside its destination gallery", () => {
    const gallery = getDestinationGallery("mendoza");

    expect(gallery).toHaveLength(3);
    expect(gallery).not.toContain("/media/destinations/mendoza/gallery-2.jpg");
    expect(gallery).not.toContain("/media/destinations/mendoza/section.jpg");
  });

  it("keeps the tour gallery stable when every source is distinct", () => {
    expect(getTourGallery("mendoza-wine")).toHaveLength(5);
  });

  it.each([
    ["banado-la-estrella", "gallery-1.jpg"],
    [
      "all-argentina-national-parks",
      "gallery-1.jpg",
    ],
    [
      "iguazu-national-park",
      "gallery-1.jpg",
    ],
  ])("does not repeat the %s hero in the rich gallery", (articleId, duplicateName) => {
    const gallery = getRichArticleGallery(articleId);

    expect(gallery.some((image) => image.src.endsWith(duplicateName))).toBe(false);
    expect(gallery.length).toBeGreaterThan(0);
  });

  it.each([
    "banado-la-estrella",
    "natsionalnye-parki-argentiny",
    "natsionalnyy-park-iguasu",
  ])("uses one canonical %s image for the card and article hero", (slug) => {
    const post = blogPosts.find((candidate) => candidate.slug === slug);

    expect(post).toBeDefined();
    expect(canonicalMediaPath(resolveBlogPostCardImage(post!))).toBe(
      canonicalMediaPath(getBlogPostHeroResolved(post!).src),
    );
  });

  it("returns no logo fallback for an empty rich gallery", () => {
    const gallery = getRichArticleGallery("ischigualasto-valley-of-the-moon");

    expect(gallery.every((image) => image.src !== "/logo-light.svg")).toBe(true);
  });

  it("filters branded and no-photo fallbacks before the client carousel", () => {
    expect(
      filterPublicGalleryImages([
        { src: "/logo-light.svg", alt: "Логотип" },
        { src: "/media/no-photo.svg", alt: "Нет фото" },
        { src: "/media/places/ischigualasto/hero.jpg", alt: "Исчигуаласто" },
      ]),
    ).toEqual([
      { src: "/media/places/ischigualasto/hero.jpg", alt: "Исчигуаласто" },
    ]);
  });
});
