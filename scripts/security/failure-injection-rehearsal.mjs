#!/usr/bin/env node
/**
 * Code-side controlled failure injection rehearsal (no live DB/Vercel required).
 *
 * Modes:
 *   --mode=upstash-down     Simulate Redis/Upstash unavailable for security_critical limits
 *   --mode=webhook-replay   Point operators at signed webhook replay unit evidence
 *   --list                  Print available modes
 *
 * Usage:
 *   node scripts/security/failure-injection-rehearsal.mjs --list
 *   node scripts/security/failure-injection-rehearsal.mjs --mode=upstash-down
 *   node scripts/security/failure-injection-rehearsal.mjs --mode=webhook-replay
 *
 * Never prints secrets. Does not mutate production.
 */
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

const MODES = {
  "upstash-down": {
    title: "Upstash / Redis unavailable (security_critical fail-closed)",
    steps: [
      "Unset UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in the rehearsal shell.",
      "Or point them at a closed local port (e.g. http://127.0.0.1:9) so REST calls fail immediately.",
      "Exercise a security_critical route (admin refund / staff / privacy) and expect 503 when Redis is configured-but-down, or documented local fallback when unset.",
      "Unit evidence: src/lib/rate-limit (security_critical fail-closed tests).",
    ],
  },
  "webhook-replay": {
    title: "Payment webhook replay / ledger repair (code harness)",
    steps: [
      "Run focused Vitest: payment-webhook-routes + webhook-handler + transaction-server.webhook.",
      "Confirm exact replay returns applied:false / replayed:true and repairs missing ledger with 500→200 path.",
      "Live provider delivery remains EXTERNAL_BLOCKER until DB/Vercel recovery.",
    ],
    vitestGlobs: [
      "src/app/api/webhooks/payments/payment-webhook-routes.test.ts",
      "src/lib/payments/webhook-handler.test.ts",
      "src/app/api/webhooks/youtravel/booking/route.test.ts",
    ],
  },
};

function parseArgs(argv) {
  const modeArg = argv.find((arg) => arg.startsWith("--mode="));
  return {
    list: argv.includes("--list") || argv.includes("-l"),
    mode: modeArg ? modeArg.slice("--mode=".length) : null,
    runTests: argv.includes("--run-tests"),
  };
}

function printMode(id, definition) {
  console.log(JSON.stringify({ mode: id, title: definition.title, steps: definition.steps }, null, 2));
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.list || !args.mode) {
    console.log(
      JSON.stringify(
        {
          status: "ok",
          kind: "failure-injection-rehearsal",
          evidenceLevel: "code_side_ops",
          modes: Object.keys(MODES),
          hint: "Pass --mode=<id>; optional --run-tests for webhook-replay",
        },
        null,
        2,
      ),
    );
    if (!args.mode) process.exit(args.list ? 0 : 0);
    return;
  }

  const definition = MODES[args.mode];
  if (!definition) {
    console.log(
      JSON.stringify({
        status: "error",
        error: "unknown_mode",
        modes: Object.keys(MODES),
      }),
    );
    process.exit(1);
  }

  printMode(args.mode, definition);

  if (args.mode === "webhook-replay" && args.runTests && definition.vitestGlobs) {
    execFileSync(
      process.execPath,
      [
        path.join(ROOT, "node_modules/vitest/vitest.mjs"),
        "run",
        ...definition.vitestGlobs,
      ],
      { cwd: ROOT, stdio: "inherit" },
    );
  }

  if (args.mode === "upstash-down") {
    console.log(
      JSON.stringify({
        status: "ok",
        rehearsal: "documented",
        note: "Do not export real Upstash tokens into this log. Use a closed local URL for fail-closed drills.",
      }),
    );
  }
}

main();
