import assert from "node:assert/strict";
import test from "node:test";
import { findForbiddenProductionArtifactMarkers } from "./production-artifact-markers.mjs";

const requiredExamples = [
  "booking-demo-new",
  "trip-demo-iguazu",
  "anna.k.demo@example.com",
  "demo-fitz-roy-vip",
  "review-demo-published",
  "booking-demo-future-42",
  "review-demo-pending-7",
  "demo.user@example.org",
  "demo_token_checkout_123",
  'clientPortalToken: "customer-demo-access"',
];

test("blocks known and generic demo seed, email, token, and id markers", () => {
  for (const source of requiredExamples) {
    assert.notEqual(
      findForbiddenProductionArtifactMarkers(source).length,
      0,
      `expected blocker for ${source}`,
    );
  }
});

test("does not block ordinary production copy or neutral identifiers", () => {
  const allowedExamples = [
    "Посмотреть демонстрацию маршрута",
    "name@example.com",
    'const runtimeMode = "demo"',
    "src/lib/demo-mode.ts",
    'bookingId: "booking-2026-01942"',
    'privateAccessToken: "live_private_9dk2"',
    "https://www.goargentina.ru/tours",
  ];

  for (const source of allowedExamples) {
    assert.deepEqual(
      findForbiddenProductionArtifactMarkers(source),
      [],
      `unexpected blocker for ${source}`,
    );
  }
});
