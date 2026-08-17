import { describe, expect, it } from "vitest";
import { evaluateBrowserMutationOrigin } from "./browser-mutation-origin";

function req(method: string, headers: Record<string, string> = {}) {
  return new Request("https://www.goargentina.ru/api/admin/users", {
    method,
    headers,
  });
}

describe("browser mutation origin strategy", () => {
  it("allows non-mutating methods without origin signals", () => {
    expect(evaluateBrowserMutationOrigin(req("GET"))).toEqual({
      ok: true,
      reason: "not_mutating",
    });
  });

  it("rejects cross-site Sec-Fetch-Site on mutating requests", () => {
    expect(
      evaluateBrowserMutationOrigin(req("POST", { "sec-fetch-site": "cross-site" })),
    ).toEqual({ ok: false, reason: "cross_site" });
  });

  it("rejects a mismatched Origin header", () => {
    expect(
      evaluateBrowserMutationOrigin(req("PATCH", { origin: "https://evil.example" })),
    ).toEqual({ ok: false, reason: "origin_mismatch" });
  });

  it("allows same-origin Origin and same-site fetch metadata", () => {
    expect(
      evaluateBrowserMutationOrigin(
        req("POST", { origin: "https://www.goargentina.ru" }),
      ),
    ).toEqual({ ok: true, reason: "same_origin" });
    expect(
      evaluateBrowserMutationOrigin(req("DELETE", { "sec-fetch-site": "same-origin" })),
    ).toEqual({ ok: true, reason: "same_site" });
  });

  it("allows missing browser signals so SameSite=Lax remains the primary control", () => {
    expect(evaluateBrowserMutationOrigin(req("POST"))).toEqual({
      ok: true,
      reason: "no_browser_signals",
    });
  });
});
