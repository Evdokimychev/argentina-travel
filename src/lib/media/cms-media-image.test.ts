import sharp from "sharp";
import { beforeAll, describe, expect, it } from "vitest";
import {
  CMS_IMAGE_MAX_WIDTH,
  processCmsUploadImage,
  shouldOptimizeCmsImage,
} from "@/lib/media/cms-media-image";

let PNG_FIXTURE: Buffer;

beforeAll(async () => {
  PNG_FIXTURE = await sharp({
    create: {
      width: 4,
      height: 4,
      channels: 3,
      background: { r: 116, g: 172, b: 223 },
    },
  })
    .png()
    .toBuffer();
});

describe("shouldOptimizeCmsImage", () => {
  it("skips gif and svg", () => {
    expect(shouldOptimizeCmsImage("image/gif")).toBe(false);
    expect(shouldOptimizeCmsImage("image/svg+xml")).toBe(false);
  });

  it("optimizes raster formats", () => {
    expect(shouldOptimizeCmsImage("image/jpeg")).toBe(true);
    expect(shouldOptimizeCmsImage("image/png")).toBe(true);
  });
});

describe("processCmsUploadImage", () => {
  it("converts png to webp with dimensions", async () => {
    const result = await processCmsUploadImage(PNG_FIXTURE, "image/png");
    expect("error" in result).toBe(false);
    if ("error" in result) return;

    expect(result.mimeType).toBe("image/webp");
    expect(result.extension).toBe("webp");
    expect(result.optimized).toBe(true);
    expect(result.width).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);
    expect(result.buffer.byteLength).toBeGreaterThan(0);
  });

  it("passes gif through without optimization", async () => {
    const gif = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");
    const result = await processCmsUploadImage(gif, "image/gif");
    expect("error" in result).toBe(false);
    if ("error" in result) return;

    expect(result.mimeType).toBe("image/gif");
    expect(result.extension).toBe("gif");
    expect(result.optimized).toBe(false);
  });

  it("rejects non-image mime", async () => {
    const result = await processCmsUploadImage(Buffer.from("text"), "text/plain");
    expect(result).toEqual({ error: "Файл не является изображением" });
  });

  it("uses max width constant for resize", () => {
    expect(CMS_IMAGE_MAX_WIDTH).toBeGreaterThanOrEqual(1920);
  });
});
