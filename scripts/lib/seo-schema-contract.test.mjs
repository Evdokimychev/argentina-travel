import assert from "node:assert/strict";
import test from "node:test";

import { hasCompatibleSchemaType } from "./seo-schema-contract.mjs";

test("accepts BlogPosting as a specialized Article schema", () => {
  assert.equal(hasCompatibleSchemaType(new Set(["BlogPosting"]), "Article"), true);
});

test("keeps unrelated schema expectations exact", () => {
  assert.equal(hasCompatibleSchemaType(new Set(["Product"]), "TouristTrip"), false);
  assert.equal(hasCompatibleSchemaType(new Set(["TouristTrip"]), "TouristTrip"), true);
});
