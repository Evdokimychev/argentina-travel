import assert from "node:assert/strict";
import test from "node:test";
import {
  isLocalLighthouseBase,
  lighthouseBudgetForPath,
  summarizeLighthousePathRuns,
} from "./lighthouse-budget-policy.mjs";

const budget = {
  performance: 55,
  accessibility: 95,
  seo: 95,
  lcpMs: 8_000,
  cls: 0.1,
  tbtMs: 2_500,
  inpMs: 200,
  homeTransferBytes: 2_500_000,
  contentTransferBytes: 1_500_000,
  scriptTransferBytes: 1_000_000,
};

test("local noindex candidate and external production are distinguished", () => {
  assert.equal(isLocalLighthouseBase("http://127.0.0.1:3000"), true);
  assert.equal(isLocalLighthouseBase("http://localhost:3000/blog"), true);
  assert.equal(isLocalLighthouseBase("https://www.goargentina.ru"), false);
});

test("three cold runs use a per-route median and require complete evidence", () => {
  const routeBudget = lighthouseBudgetForPath(budget, "/", { local: true });
  const base = {
    performance: 75,
    accessibility: 100,
    seo: null,
    lcpMs: 4_500,
    cls: 0.03,
    tbtMs: 250,
    transferBytes: 900_000,
    scriptTransferBytes: 450_000,
    inpMs: null,
  };
  const summary = summarizeLighthousePathRuns({
    path: "/",
    runs: [{ ...base, performance: 40, tbtMs: 3_000 }, base, { ...base, performance: 78 }],
    requiredRuns: 3,
    budget: routeBudget,
    seoBlocking: false,
  });
  assert.equal(summary.performance, 75);
  assert.equal(summary.pass, true);

  const incomplete = summarizeLighthousePathRuns({
    path: "/",
    runs: [base, { error: "lighthouse failed" }, base],
    requiredRuns: 3,
    budget: routeBudget,
    seoBlocking: false,
  });
  assert.equal(incomplete.pass, false);
});

test("local route exceptions remain bounded while production stays strict", () => {
  const localMap = lighthouseBudgetForPath(budget, "/mapa-argentina", { local: true });
  const prodMap = lighthouseBudgetForPath(budget, "/mapa-argentina", { local: false });
  const localPartner = lighthouseBudgetForPath(budget, "/tours/partner", { local: true });
  const localDestination = lighthouseBudgetForPath(budget, "/destinations/patagonia", {
    local: true,
  });
  const prodDestination = lighthouseBudgetForPath(budget, "/destinations/patagonia", {
    local: false,
  });
  assert.equal(localMap.accessibility, 85);
  assert.equal(localMap.tbtMs, 3_500);
  assert.equal(prodMap.accessibility, 95);
  assert.equal(localPartner.lcpMs, 10_000);
  assert.equal(localPartner.transferBytes, 1_800_000);
  assert.equal(localDestination.performance, 50);
  assert.equal(prodDestination.performance, 55);
});
