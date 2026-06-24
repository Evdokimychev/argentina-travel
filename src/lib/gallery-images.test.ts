import { describe, expect, it } from "vitest";
import { dedupeGalleryImages, galleryImageIdentityKey } from "@/lib/gallery-images";

describe("gallery-images", () => {
  it("dedupes YouTravel CDN urls by file id", () => {
    const a = "https://cf.youtravel.me/upload/main/9f1/4pa84dzuo2v6mu32j0ja2wjy47gfaeva.JPG";
    const b = "https://cf.youtravel.me/upload/main/9f1/4pa84dzuo2v6mu32j0ja2wjy47gfaeva.jpg";
    expect(galleryImageIdentityKey(a)).toBe(galleryImageIdentityKey(b));

    const unique = dedupeGalleryImages([a, b, "https://cf.youtravel.me/upload/main/9f1/otherfile.jpg"]);
    expect(unique).toHaveLength(2);
    expect(unique[0]).toBe(a);
  });
});
