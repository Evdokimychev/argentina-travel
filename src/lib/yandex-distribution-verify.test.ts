import { describe, expect, it } from "vitest";
import { resolveYandexDistributionVerifyCode, YANDEX_DISTRIBUTION_VERIFY_CODE } from "./yandex-distribution-verify";

describe("resolveYandexDistributionVerifyCode", () => {
  it("prefers CMS token over built-in default", () => {
    expect(resolveYandexDistributionVerifyCode({ yandexSiteVerification: "from-cms" })).toBe("from-cms");
  });

  it("falls back to partner onboarding code", () => {
    expect(resolveYandexDistributionVerifyCode({})).toBe(YANDEX_DISTRIBUTION_VERIFY_CODE);
  });
});
