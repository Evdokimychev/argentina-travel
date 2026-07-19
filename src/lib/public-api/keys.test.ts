import { describe, expect, it } from "vitest";
import { parsePublicApiScopes, publicApiKeyHasScope } from "@/lib/public-api/keys";

describe("public API key scopes", () => {
  it("accepts dedicated knowledge collector scopes", () => {
    expect(parsePublicApiScopes(["content:write", "content:status", "invalid"])).toEqual([
      "content:write",
      "content:status",
    ]);
  });

  it("does not grant content writes to ordinary read keys", () => {
    expect(publicApiKeyHasScope(["tours:read"], "content:write")).toBe(false);
    expect(publicApiKeyHasScope(["*"], "content:write")).toBe(true);
  });
});
