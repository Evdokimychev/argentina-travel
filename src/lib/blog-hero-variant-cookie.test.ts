import { describe, expect, it } from "vitest";
import { resolveBlogHeroVariantFromCookie } from "@/lib/blog-hero-variant-cookie";

describe("resolveBlogHeroVariantFromCookie", () => {
  it("returns stored variant when valid", () => {
    expect(resolveBlogHeroVariantFromCookie("a")).toBe("a");
    expect(resolveBlogHeroVariantFromCookie("b")).toBe("b");
  });

  it("assigns deterministic variant from seed when cookie missing", () => {
    const first = resolveBlogHeroVariantFromCookie(undefined, "session-1");
    const second = resolveBlogHeroVariantFromCookie(undefined, "session-1");
    expect(first === "a" || first === "b").toBe(true);
    expect(second).toBe(first);
  });
});
