import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { blogDestinationCardImage } from "./blog-destination-image-delivery";

const root = process.cwd();
const derivativePaths = [
  "media/services/blog/hero-mobile.webp",
  "media/blog/best-time-to-visit-argentina/hero-mobile.webp",
  ...["ba", "bariloche", "calafate", "ushuaia", "iguazu", "mendoza", "patagonia"].map(
    (id) => `media/destinations/${id}/section-card.webp`,
  ),
];

describe("blog mobile image delivery", () => {
  it("uses compact destination images only where a tracked derivative exists", () => {
    expect(blogDestinationCardImage("ba", "/media/destinations/ba/section.jpg")).toBe(
      "/media/destinations/ba/section-card.webp",
    );
    expect(blogDestinationCardImage("salta", "/media/destinations/salta/section.jpg")).toBe(
      "/media/destinations/salta/section.jpg",
    );
  });

  it("keeps every referenced derivative small and rights-tracked", () => {
    const manifest = JSON.parse(
      fs.readFileSync(path.join(root, "src/data/media-library/manifest.json"), "utf8"),
    ) as {
      assets: Array<{
        localPath?: string;
        sourceUrl?: string;
        license?: string;
        derivedFrom?: string;
      }>;
    };

    for (const localPath of derivativePaths) {
      const asset = manifest.assets.find((candidate) => candidate.localPath === localPath);
      expect(asset, localPath).toMatchObject({
        localPath,
        sourceUrl: expect.any(String),
        license: expect.any(String),
        derivedFrom: expect.any(String),
      });
      expect(fs.statSync(path.join(root, "public", localPath)).size, localPath).toBeLessThan(260_000);
    }
  });
});
