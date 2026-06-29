import { describe, it, expect, afterEach } from "vitest";
import { getSiteUrl, absoluteUrl } from "./site-url";

const ORIGINAL = process.env.NEXT_PUBLIC_SITE_URL;

afterEach(() => {
  if (ORIGINAL === undefined) {
    delete process.env.NEXT_PUBLIC_SITE_URL;
  } else {
    process.env.NEXT_PUBLIC_SITE_URL = ORIGINAL;
  }
});

describe("getSiteUrl", () => {
  it("falls back to the production domain for Vercel preview/deployment hosts", () => {
    process.env.NEXT_PUBLIC_SITE_URL =
      "https://argentina-travel-xxx.vercel.app";
    expect(getSiteUrl()).toBe("https://www.goargentina.ru");
  });

  it("ignores localhost and *.local", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
    expect(getSiteUrl()).toBe("https://www.goargentina.ru");
  });

  it("keeps a valid custom domain and strips the trailing slash", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://www.goargentina.ru/";
    expect(getSiteUrl()).toBe("https://www.goargentina.ru");
  });

  it("falls back to the default when the value is unset", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    expect(getSiteUrl()).toBe("https://www.goargentina.ru");
  });

  it("falls back when the value is not a valid URL", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "not-a-url";
    expect(getSiteUrl()).toBe("https://www.goargentina.ru");
  });
});

describe("absoluteUrl", () => {
  it("never emits a vercel.app origin for canonical/OG", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://foo.vercel.app";
    expect(absoluteUrl("/tours")).toBe("https://www.goargentina.ru/tours");
  });

  it("normalizes a path without a leading slash", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://www.goargentina.ru";
    expect(absoluteUrl("places")).toBe("https://www.goargentina.ru/places");
  });
});
