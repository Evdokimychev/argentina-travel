import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const manifest = JSON.parse(
  fs.readFileSync(path.join(root, "src/data/media-library/manifest.json"), "utf8"),
) as { assets: Array<{ id: string; localPath?: string }> };

function publicMediaPath(localPath: string): string {
  const normalized = localPath.replace(/^\/+/, "");
  const rel = normalized.startsWith("media/") ? normalized : `media/${normalized}`;
  return path.join(root, "public", rel);
}

describe("media manifest integrity", () => {
  it("every manifest localPath exists under public/", () => {
    const missing: string[] = [];
    for (const asset of manifest.assets) {
      if (!asset.localPath) continue;
      if (!fs.existsSync(publicMediaPath(asset.localPath))) {
        missing.push(`${asset.id} → ${asset.localPath}`);
      }
    }
    expect(missing, missing.join("\n")).toEqual([]);
  });

  it("includes tour-card placeholder for partner listing fallback", () => {
    expect(fs.existsSync(path.join(root, "public/media/placeholders/tour-card.jpg"))).toBe(true);
  });
});
