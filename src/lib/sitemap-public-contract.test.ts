import { describe, expect, it } from "vitest";

import { isIndexableInternalPath } from "./sitemap-urls";

describe("public sitemap contract", () => {
  it("excludes partner city pages whose availability cannot be guaranteed", () => {
    expect(isIndexableInternalPath("/excursions/city/Buenos_Aires")).toBe(false);
    expect(isIndexableInternalPath("/excursions/city/Ushuaia")).toBe(false);
    expect(isIndexableInternalPath("/excursions/city/Mendoza")).toBe(false);
  });

  it("keeps stable public hubs indexable", () => {
    expect(isIndexableInternalPath("/excursions")).toBe(true);
    expect(isIndexableInternalPath("/blog/authors")).toBe(true);
  });
});
