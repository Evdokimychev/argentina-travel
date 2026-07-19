import { describe, expect, it } from "vitest";
import { assertSecretFreeConfig, sourcePatchFromBody } from "@/lib/ingestion/api-validation";

describe("ingestion API validation", () => {
  it("rejects secrets at any nesting level", () => {
    expect(() => assertSecretFreeConfig({ headers: { authorization: "Bearer hidden" } })).toThrow(/Секретное поле/);
    expect(() => assertSecretFreeConfig({ apiKey: "hidden" })).toThrow(/Секретное поле/);
  });

  it("keeps only allowed source fields", () => {
    expect(sourcePatchFromBody({ name: "RSS", sourceType: "rss", connectionConfig: { feedUrl: "https://example.com/feed" }, injected: true })).toEqual({ name: "RSS", sourceType: "rss", connectionConfig: { feedUrl: "https://example.com/feed" } });
  });

  it("accepts an environment reference but never a credential value", () => {
    expect(sourcePatchFromBody({ credentialRef: "ARGENTINA_TELEGRAM" }).credentialRef).toBe("ARGENTINA_TELEGRAM");
    expect(() => sourcePatchFromBody({ credentialRef: "actual token" })).toThrow(/Некорректная/);
  });
});
