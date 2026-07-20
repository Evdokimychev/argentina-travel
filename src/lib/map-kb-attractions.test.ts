import { describe, expect, it } from "vitest";

import { resolveKbMapImage } from "@/lib/map-kb-attractions";

describe("KB map image resolution", () => {
  it("keeps bundled media local when the CDN import is not ready", () => {
    const path = "/media/argentina-travel/los-alerces/hero.jpg";
    expect(resolveKbMapImage(path)).toBe(path);
  });

  it("leaves a missing image empty", () => {
    expect(resolveKbMapImage()).toBeUndefined();
  });
});
