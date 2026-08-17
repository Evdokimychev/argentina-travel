import fs from "node:fs";
import path from "path";
import { describe, expect, it } from "vitest";
import {
  BLOG_EDITORIAL_AVATAR_LEGACY_SRC,
  BLOG_EDITORIAL_AVATAR_SRC,
  blogAuthorAvatarImage,
  blogCardListingImage,
} from "./blog-card-image-delivery";

const root = process.cwd();

const REQUIRED_DERIVATIVES = [
  "media/blog/editorial-avatar.webp",
  "media/blog/iguazu-garganta-del-diablo/hero-card.webp",
  "media/blog/grazhdanstvo-argentiny/hero-card.webp",
  "media/blog/salta-i-severo-zapad-marshrut/hero-card.webp",
  "media/places/buenos-aires/hero-card.webp",
  "media/places/los-glaciares-national-park/hero-card.webp",
];

describe("blog card image delivery", () => {
  it("rewrites listing heroes to committed -card.webp derivatives", () => {
    expect(blogCardListingImage("/media/blog/iguazu-garganta-del-diablo/hero.jpg")).toBe(
      "/media/blog/iguazu-garganta-del-diablo/hero-card.webp",
    );
    expect(blogCardListingImage("/media/places/buenos-aires/hero.jpg")).toBe(
      "/media/places/buenos-aires/hero-card.webp",
    );
    expect(blogCardListingImage("/media/places/el-chalten/gallery-1.jpg")).toBe(
      "/media/places/el-chalten/gallery-1-card.webp",
    );
    expect(blogCardListingImage("/media/blog/food.jpg")).toBe("/media/blog/food-card.webp");
  });

  it("keeps compact derivatives and remaps the legacy editorial avatar", () => {
    expect(blogCardListingImage("/media/services/blog/hero-mobile.webp")).toBe(
      "/media/services/blog/hero-mobile.webp",
    );
    expect(blogCardListingImage("/media/blog/x/hero-card.webp")).toBe(
      "/media/blog/x/hero-card.webp",
    );
    expect(blogCardListingImage(BLOG_EDITORIAL_AVATAR_LEGACY_SRC)).toBe(BLOG_EDITORIAL_AVATAR_SRC);
    expect(blogAuthorAvatarImage(BLOG_EDITORIAL_AVATAR_LEGACY_SRC)).toBe(BLOG_EDITORIAL_AVATAR_SRC);
  });

  it("keeps BlogCard/index/hub contracts on lazy catalog covers and listing derivatives", () => {
    const card = fs.readFileSync(path.join(root, "src/components/blog/BlogCard.tsx"), "utf8");
    const index = fs.readFileSync(path.join(root, "src/components/blog/BlogIndexView.tsx"), "utf8");
    const hub = fs.readFileSync(path.join(root, "src/components/blog/BlogHubCatalog.tsx"), "utf8");
    const author = fs.readFileSync(path.join(root, "src/data/blog-author.ts"), "utf8");

    expect(card).toContain("blogCardListingImage(post.image)");
    expect(card).toContain("FEATURED_CARD_SIZES");
    expect(card).toContain("STANDARD_CARD_SIZES");
    expect(index).toContain("priority={false}");
    expect(hub).toContain("priority={false}");
    expect(author).toContain(BLOG_EDITORIAL_AVATAR_SRC);
    expect(author).not.toContain(BLOG_EDITORIAL_AVATAR_LEGACY_SRC);
  });

  it("keeps hub listing derivatives inside the mobile card budget", () => {
    for (const localPath of REQUIRED_DERIVATIVES) {
      const absolutePath = path.join(root, "public", localPath);
      expect(fs.existsSync(absolutePath), localPath).toBe(true);
      expect(fs.statSync(absolutePath).size, localPath).toBeLessThan(260_000);
    }
  });
});
