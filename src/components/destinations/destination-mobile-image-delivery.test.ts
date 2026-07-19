import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const patagoniaDerivatives = [
  "section-mobile.webp",
  "cover-card.webp",
  "gallery-1-card.webp",
  "gallery-2-card.webp",
  "gallery-3-card.webp",
];

describe("Patagonia mobile image delivery", () => {
  it("keeps the mobile hero discoverable, high priority and avoids the repeated section image", () => {
    const source = fs.readFileSync(
      path.join(root, "src/components/destinations/DestinationDetailView.tsx"),
      "utf8",
    );

    expect(source).toContain('srcSet="/media/destinations/patagonia/section-mobile.webp"');
    expect(source).toContain('fetchPriority="high"');
    expect(source).toContain("{!isPatagonia ? (");
    expect(source).toContain("images={galleryImages}");
  });

  it("keeps Patagonia delivery assets within mobile/card budgets", async () => {
    for (const filename of patagoniaDerivatives) {
      const absolutePath = path.join(root, "public/media/destinations/patagonia", filename);
      const metadata = await sharp(absolutePath).metadata();
      const maxEdge = Math.max(metadata.width ?? 0, metadata.height ?? 0);

      expect(maxEdge, filename).toBeLessThanOrEqual(1600);
      expect(fs.statSync(absolutePath).size, filename).toBeLessThan(260_000);
    }
  });
});
