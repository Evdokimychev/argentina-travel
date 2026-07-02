import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildCmsStoragePublicUrl,
  buildReviewPhotoPublicUrl,
  getMediaCdnOrigin,
  mediaUrl,
  rewriteLegacySupabaseMediaUrl,
} from "@/lib/media/media-cdn";

describe("media-cdn", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns site-relative URLs when CDN is not configured", () => {
    expect(mediaUrl("media/places/buenos-aires/hero.jpg")).toBe("/media/places/buenos-aires/hero.jpg");
  });

  it("prefixes manifest paths with the external CDN origin", () => {
    vi.stubEnv("NEXT_PUBLIC_MEDIA_CDN_URL", "https://media.goargentina.ru");
    expect(getMediaCdnOrigin()).toBe("https://media.goargentina.ru");
    expect(mediaUrl("media/places/buenos-aires/hero.jpg")).toBe(
      "https://media.goargentina.ru/media/places/buenos-aires/hero.jpg"
    );
  });

  it("rewrites legacy Supabase CMS URLs to the CDN", () => {
    vi.stubEnv("NEXT_PUBLIC_MEDIA_CDN_URL", "https://goargentina.ru/site-media");
    expect(
      rewriteLegacySupabaseMediaUrl(
        "https://abc.supabase.co/storage/v1/object/public/cms-media/uploads/2026/file.webp"
      )
    ).toBe("https://goargentina.ru/site-media/uploads/2026/file.webp");
  });

  it("rewrites legacy Supabase review photo URLs to the CDN", () => {
    vi.stubEnv("NEXT_PUBLIC_MEDIA_CDN_URL", "https://goargentina.ru/site-media");
    expect(
      rewriteLegacySupabaseMediaUrl(
        "https://abc.supabase.co/storage/v1/object/public/tourist-review-photos/user-1/photo.jpg"
      )
    ).toBe("https://goargentina.ru/site-media/reviews/user-1/photo.jpg");
  });

  it("builds CMS and review storage URLs from relative paths", () => {
    vi.stubEnv("NEXT_PUBLIC_MEDIA_CDN_URL", "https://goargentina.ru/site-media");
    expect(buildCmsStoragePublicUrl("uploads/2026/file.webp")).toBe(
      "https://goargentina.ru/site-media/uploads/2026/file.webp"
    );
    expect(buildReviewPhotoPublicUrl("user-1/photo.jpg")).toBe(
      "https://goargentina.ru/site-media/reviews/user-1/photo.jpg"
    );
  });
});
