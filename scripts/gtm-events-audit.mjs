#!/usr/bin/env node
/**
 * Verify GTM_EVENTS in code are documented in docs/analytics-gtm-setup.md.
 *
 * Usage:
 *   node scripts/gtm-events-audit.mjs
 *   npm run gtm-events:audit
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const eventsFile = path.join(root, "src/lib/analytics/gtm-events.ts");
const docsFile = path.join(root, "docs/analytics-gtm-setup.md");

function extractGtmEventValues(source) {
  const values = [];
  for (const match of source.matchAll(/:\s*"([a-z0-9_]+)"/g)) {
    const value = match[1];
    if (value.includes("_") || ["booking_submit", "contact_form_submit"].includes(value)) {
      values.push(value);
    }
  }
  const objectBlock = source.match(/export const GTM_EVENTS = \{([\s\S]*?)\} as const;/);
  if (!objectBlock) return values;
  const fromBlock = [...objectBlock[1].matchAll(/:\s*"([a-z0-9_]+)"/g)].map((m) => m[1]);
  return [...new Set(fromBlock)];
}

function main() {
  const eventsSource = fs.readFileSync(eventsFile, "utf8");
  const docs = fs.readFileSync(docsFile, "utf8");
  const eventValues = extractGtmEventValues(eventsSource);
  const unique = new Set(eventValues);

  if (unique.size !== eventValues.length) {
    console.error("✗ Duplicate GTM_EVENTS values in gtm-events.ts");
    process.exit(1);
  }

  const missingInDocs = eventValues.filter((name) => !docs.includes(`\`${name}\``) && !docs.includes(name));
  const regexSection = docs.match(/Custom Event[\s\S]*?```\s*\n([\s\S]*?)```/);
  const regexBody = regexSection?.[1] ?? docs;
  const missingInRegex = eventValues.filter((name) => !regexBody.includes(name));

  console.log(`GTM events audit — ${eventValues.length} events in code`);

  if (missingInDocs.length > 0) {
    console.error("✗ Not documented in analytics-gtm-setup.md:");
    for (const name of missingInDocs) console.error(`  - ${name}`);
  } else {
    console.log("✓ All events listed in docs (section 6 table or inline)");
  }

  if (missingInRegex.length > 0) {
    console.error("✗ Missing from GTM Custom Event trigger regex:");
    for (const name of missingInRegex) console.error(`  - ${name}`);
  } else {
    console.log("✓ All events covered by GTM trigger regex");
  }

  if (missingInDocs.length > 0 || missingInRegex.length > 0) {
    process.exit(1);
  }
}

main();
