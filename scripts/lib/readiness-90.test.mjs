import assert from "node:assert/strict";
import test from "node:test";
import { evaluateReadiness90 } from "./readiness-90.mjs";

const journey = (id) => ({
  id,
  status: "passed",
  evidence: {
    browser: true,
    request: true,
    database: true,
    roleVisibility: true,
    cleanup: true,
  },
});

function completeEvidence() {
  const journeyIds = Array.from({ length: 22 }, (_, index) => `J${String(index + 1).padStart(2, "0")}`);
  return {
    publicEditorial: { status: "passed", errors: [] },
    seo: { ok: true, sitemap: { urlCount: 500, crawledUrlCount: 500, criticalIssues: [] } },
    lighthouse: {
      pass: true,
      medianPerformance: 95,
      medianAccessibility: 100,
      results: [{ lcpMs: 1800, cls: 0.03 }, { lcpMs: 2100, cls: 0.05 }],
    },
    ux: { summary: { total: 100, passed: 100, failed: 0, skipped: 0 } },
    productionReadiness: { ok: true, summary: { ok: 10, warn: 0, fail: 0, skip: 0 } },
    publish: { ok: true, summary: { ok: 10, warn: 0, fail: 0, manual: 0 } },
    release: {
      status: "passed",
      requestedGroup: "all",
      checks: [{ group: "commerce", status: "passed" }],
    },
    analytics: {
      ok: true,
      summary: { ok: 4, warn: 0, fail: 0, skip: 0 },
      checks: [
        "live:gtm",
        "live:gtm-consent-default",
        "live:datalayer-init",
        "live:google-verification",
        "live:robots-sitemap",
      ].map((id) => ({ id, status: "ok" })),
    },
    rls: { ok: true },
    staging: { status: "passed", journeys: journeyIds.map(journey) },
    partnerAttribution: {
      status: "passed",
      testClick: true,
      partnerDashboardProof: true,
      reconciliation: true,
    },
    commercialFunnel: {
      status: "passed",
      events: true,
      dashboard: true,
      conversionProof: true,
      leadCapture: true,
      deduplication: true,
      revenueAttribution: true,
    },
    paymentProvider: {
      status: "passed",
      ownerApproval: true,
      sandboxPayment: true,
      signedWebhook: true,
      reconciliation: true,
      refundProof: true,
      disputeProcess: true,
      idempotency: true,
      legalReview: true,
      receiptPolicy: true,
      merchantContract: true,
    },
    operations: {
      status: "passed",
      emailOutbox: true,
      retryProof: true,
      alerting: true,
      bookingSlo: true,
      incidentRunbook: true,
    },
  };
}

test("missing evidence cannot be scored as ready", () => {
  const result = evaluateReadiness90({});
  assert.equal(result.ready, false);
  assert.equal(result.overall, 0);
  assert.ok(
    result.roles
      .filter((role) => role.applicable !== false)
      .every((role) => role.score < 90),
  );
  const payments = result.roles.find((role) => role.id === "payments");
  assert.equal(payments.applicable, false);
  assert.equal(payments.ready, true);
});

test("complete reproducible evidence scores every applicable role above target", () => {
  const result = evaluateReadiness90(completeEvidence());
  assert.equal(result.ready, true);
  assert.ok(
    result.roles
      .filter((role) => role.applicable !== false)
      .every((role) => role.score >= 90),
  );
});

test("local-contract commercial funnel cannot satisfy live claim ratios", () => {
  const evidence = completeEvidence();
  evidence.commercialFunnel = {
    status: "passed",
    evidenceLevel: "local-contract",
    events: true,
    dashboard: true,
    conversionProof: true,
    leadCapture: true,
    deduplication: true,
    revenueAttribution: true,
  };
  const result = evaluateReadiness90(evidence);
  const affiliate = result.roles.find((role) => role.id === "affiliate");
  const leads = result.roles.find((role) => role.id === "leads");
  const analytics = result.roles.find((role) => role.id === "analytics");
  assert.equal(affiliate.evidence.find((item) => item.id === "funnel").earned, 0);
  assert.equal(leads.evidence.find((item) => item.id === "funnel").earned, 0);
  assert.equal(analytics.evidence.find((item) => item.id === "funnel").earned, 0);
  assert.equal(result.ready, false);
});

test("a passed Lighthouse flag cannot hide slow pages", () => {
  const evidence = completeEvidence();
  evidence.lighthouse = {
    pass: true,
    medianPerformance: 55,
    medianAccessibility: 100,
    results: [{ lcpMs: 9000, cls: 0.4 }],
  };
  const result = evaluateReadiness90(evidence);
  const portal = result.roles.find((role) => role.id === "portal");
  assert.ok(portal.score < 90);
  assert.equal(result.ready, false);
});

test("staging journeys require all five evidence layers", () => {
  const evidence = completeEvidence();
  delete evidence.staging.journeys.find((item) => item.id === "J16").evidence.cleanup;
  const result = evaluateReadiness90(evidence);
  const booking = result.roles.find((role) => role.id === "booking");
  assert.ok(booking.score < 90);
});

test("a partial release group cannot impersonate a full release", () => {
  const evidence = completeEvidence();
  evidence.release.requestedGroup = "commerce";
  const result = evaluateReadiness90(evidence);
  const portal = result.roles.find((role) => role.id === "portal");
  const affiliate = result.roles.find((role) => role.id === "affiliate");
  const booking = result.roles.find((role) => role.id === "booking");
  assert.ok(portal.score < 90);
  assert.equal(
    affiliate.evidence.find((item) => item.id === "commerce-gate").earned,
    0,
  );
  assert.equal(
    booking.evidence.find((item) => item.id === "commerce-gate").earned,
    0,
  );
});

test("failed SEO, skipped UX, and truthy strings cannot impersonate verified proof", () => {
  const evidence = completeEvidence();
  evidence.seo.ok = false;
  evidence.ux.summary = { total: 100, passed: 99, failed: 0, skipped: 1 };
  evidence.partnerAttribution.partnerDashboardProof = "dashboard.png";
  const result = evaluateReadiness90(evidence);
  const portal = result.roles.find((role) => role.id === "portal");
  const affiliate = result.roles.find((role) => role.id === "affiliate");
  assert.equal(portal.evidence.find((item) => item.id === "seo").earned, 0);
  assert.equal(portal.evidence.find((item) => item.id === "ux").earned, 0);
  assert.ok(affiliate.evidence.find((item) => item.id === "partner-attribution").ratio < 1);
  assert.equal(result.ready, false);
});

test("local Lighthouse cannot close the final CDN performance gate", () => {
  const evidence = completeEvidence();
  evidence.lighthouse.evidenceEnvironment = "local-production";
  const result = evaluateReadiness90(evidence);
  const performance = result.roles
    .find((role) => role.id === "portal")
    .evidence.find((item) => item.id === "performance");
  assert.equal(performance.ratio, 0.89);
});
