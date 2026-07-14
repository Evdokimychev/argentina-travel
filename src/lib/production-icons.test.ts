import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const PUBLIC_DIR = join(process.cwd(), "public");

function pngSize(path: string): { width: number; height: number } {
  const bytes = readFileSync(path);
  expect(bytes.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

describe("production browser icons", () => {
  it.each([
    ["favicon-16x16.png", 16],
    ["favicon-32x32.png", 32],
    ["apple-touch-icon.png", 180],
  ])("ships %s at the declared size", (file, size) => {
    expect(pngSize(join(PUBLIC_DIR, file))).toEqual({ width: size, height: size });
  });

  it("ships a real favicon.ico container", () => {
    const bytes = readFileSync(join(PUBLIC_DIR, "favicon.ico"));
    expect(bytes.subarray(0, 4).toString("hex")).toBe("00000100");
  });

  it("keeps installable PNG icons in the web manifest", () => {
    const manifest = JSON.parse(readFileSync(join(PUBLIC_DIR, "manifest.json"), "utf8")) as {
      icons?: Array<{ src?: string; sizes?: string; type?: string }>;
    };
    expect(manifest.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }),
        expect.objectContaining({ src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }),
      ]),
    );
  });
});
