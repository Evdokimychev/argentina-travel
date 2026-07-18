import { describe, expect, it } from "vitest";
import {
  normalizeRedirectFromPath,
  normalizeRedirectToPath,
  validateUrlRedirectGraph,
  validateUrlRedirectInput,
} from "@/lib/redirects/url-redirect-normalize";

describe("normalizeRedirectFromPath", () => {
  it("adds leading slash and trims trailing slash", () => {
    expect(normalizeRedirectFromPath("blog/old")).toBe("/blog/old");
    expect(normalizeRedirectFromPath("/blog/old/")).toBe("/blog/old");
    expect(normalizeRedirectFromPath("/")).toBe("/");
  });
});

describe("validateUrlRedirectGraph", () => {
  it("rejects a two-node cycle", () => {
    expect(
      validateUrlRedirectGraph([
        { fromPath: "/a", toPath: "/b" },
        { fromPath: "/b", toPath: "/a" },
      ])
    ).toMatch(/цикл/);
  });

  it("rejects a cycle through an existing chain", () => {
    expect(
      validateUrlRedirectGraph([
        { fromPath: "/a", toPath: "/b" },
        { fromPath: "/b", toPath: "/c" },
        { fromPath: "/c", toPath: "/a" },
      ])
    ).toMatch(/цикл/);
  });

  it("accepts an internal chain that reaches a final page", () => {
    expect(
      validateUrlRedirectGraph([
        { fromPath: "/a", toPath: "/b" },
        { fromPath: "/b", toPath: "/final" },
      ])
    ).toBeNull();
  });
});

describe("normalizeRedirectToPath", () => {
  it("keeps absolute URLs", () => {
    expect(normalizeRedirectToPath("https://example.com/x")).toBe("https://example.com/x");
  });

  it("normalizes relative paths", () => {
    expect(normalizeRedirectToPath("blog/new/")).toBe("/blog/new");
  });
});

describe("validateUrlRedirectInput", () => {
  it("rejects identical paths", () => {
    expect(
      validateUrlRedirectInput({ fromPath: "/same", toPath: "/same" })
    ).toMatch(/совпадать/);
  });

  it("accepts valid redirect", () => {
    expect(
      validateUrlRedirectInput({ fromPath: "/old", toPath: "/new" })
    ).toBeNull();
  });
});
