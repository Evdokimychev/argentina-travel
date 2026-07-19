import { describe, expect, it } from "vitest";
import {
  isValidAuthEmail,
  cleanAuthEntryUrl,
  mapAuthClientError,
  normalizeAuthEmail,
  parseRetryAfterSeconds,
  resolveSafeAuthNext,
} from "./auth-flow";

describe("auth flow helpers", () => {
  it("normalizes case, whitespace and invisible characters", () => {
    expect(normalizeAuthEmail(" \u200BIAEvdokimychev@YA.RU\uFEFF ")).toBe(
      "iaevdokimychev@ya.ru"
    );
    expect(isValidAuthEmail("owner@example.com")).toBe(true);
  });

  it("allows only internal auth destinations", () => {
    expect(resolveSafeAuthNext("https://evil.example", "email")).toBe("/");
    expect(resolveSafeAuthNext("/profile", "email")).toBe("/profile");
    expect(resolveSafeAuthNext("/join", "signup")).toBe("/join");
    expect(resolveSafeAuthNext("/profile", "recovery")).toBe("/account/update-password");
  });

  it("cleans auth entry parameters without discarding unrelated query state", () => {
    expect(cleanAuthEntryUrl("auth=sign-in&role=organizer&step=forgot-password&next=%2Fprofile"))
      .toBe("/");
    expect(cleanAuthEntryUrl("utm_source=header&auth=sign-in&error=expired"))
      .toBe("/?utm_source=header");
  });

  it("parses rate limits and maps auth errors", () => {
    expect(parseRetryAfterSeconds("request again after 42 seconds")).toBe(42);
    expect(mapAuthClientError({ status: 429, message: "Too many requests" })).toBe("rate_limit");
    expect(mapAuthClientError({ message: "Invalid login credentials" })).toBe(
      "invalid_credentials"
    );
  });
});
