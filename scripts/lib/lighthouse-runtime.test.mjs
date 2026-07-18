import assert from "node:assert/strict";
import test from "node:test";
import { resolveLighthouseStartTimeout } from "./lighthouse-runtime.mjs";

test("Lighthouse startup timeout honors a bounded CI override", () => {
  assert.equal(resolveLighthouseStartTimeout("180000"), 180_000);
  assert.equal(resolveLighthouseStartTimeout("30000"), 30_000);
  assert.equal(resolveLighthouseStartTimeout("600000"), 600_000);
  assert.equal(resolveLighthouseStartTimeout("not-a-number"), 180_000);
  assert.equal(resolveLighthouseStartTimeout("1000"), 180_000);
  assert.equal(resolveLighthouseStartTimeout("900000"), 180_000);
});
