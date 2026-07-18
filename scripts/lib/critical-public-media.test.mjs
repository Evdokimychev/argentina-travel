import assert from "node:assert/strict";
import test from "node:test";
import {
  CRITICAL_PUBLIC_MEDIA,
  MOBILE_DERIVATIVE_BUDGET_BYTES,
  isMobileDerivative,
  mediaBudgetFor,
} from "./critical-public-media.mjs";

test("critical public media inventory has unique public paths and bounded budgets", () => {
  const paths = CRITICAL_PUBLIC_MEDIA.map((entry) => entry.path);
  assert.equal(new Set(paths).size, paths.length);
  assert.ok(paths.every((entry) => entry.startsWith("media/") && !entry.includes("..")));
  assert.ok(CRITICAL_PUBLIC_MEDIA.every((entry) => mediaBudgetFor(entry) <= 700 * 1024));
});

test("mobile derivative convention is narrow and blocking", () => {
  assert.equal(isMobileDerivative("media/home/hero-mobile.webp"), true);
  assert.equal(isMobileDerivative("media/blog/story/hero-card.webp"), true);
  assert.equal(isMobileDerivative("media/blog/story/hero-lcp-small.avif"), true);
  assert.equal(isMobileDerivative("media/blog/story/hero.jpg"), false);
  assert.ok(MOBILE_DERIVATIVE_BUDGET_BYTES <= 260 * 1024);
});
