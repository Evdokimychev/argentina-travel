import { describe, expect, it } from "vitest";
import { hasSupabaseAuthSessionCookie } from "@/lib/personalization/interaction-context-server";

describe("interaction actor session fast path", () => {
  it("skips remote auth when the visitor has no Supabase session cookie", () => {
    expect(hasSupabaseAuthSessionCookie([])).toBe(false);
    expect(hasSupabaseAuthSessionCookie([{ name: "pa_vid" }])).toBe(false);
    expect(hasSupabaseAuthSessionCookie([{ name: "cookie-consent" }])).toBe(false);
  });

  it("recognizes regular and chunked Supabase auth cookies", () => {
    expect(
      hasSupabaseAuthSessionCookie([{ name: "sb-projectref-auth-token" }]),
    ).toBe(true);
    expect(
      hasSupabaseAuthSessionCookie([{ name: "sb-projectref-auth-token.0" }]),
    ).toBe(true);
  });
});
