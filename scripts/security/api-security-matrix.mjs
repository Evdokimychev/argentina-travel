#!/usr/bin/env node
/**
 * High-risk API security matrix derived from attack-surface inventory.
 *
 * Usage: node scripts/security/api-security-matrix.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildAttackSurfaceInventory } from "./attack-surface.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const OUTPUT = path.join(ROOT, "var/ops/api-security-matrix.json");

function riskTier(route) {
  const pathName = route.route;
  const signals = route.signals;
  const methods = route.methods;
  const mutating = methods.some((m) => ["POST", "PUT", "PATCH", "DELETE"].includes(m));

  if (pathName.startsWith("/api/admin/payments") || pathName.includes("/refund")) {
    return { tier: "critical", reason: "finance_mutation_surface" };
  }
  if (pathName.startsWith("/api/admin/staff") || pathName.startsWith("/api/admin/users")) {
    return { tier: "critical", reason: "staff_or_user_privilege_surface" };
  }
  if (pathName.includes("privacy") || pathName.includes("moderation")) {
    return { tier: "high", reason: "privacy_or_moderation_surface" };
  }
  if (pathName.startsWith("/api/admin/")) {
    return { tier: mutating ? "high" : "medium", reason: "admin_api" };
  }
  if (pathName.startsWith("/api/auth/") || pathName.includes("newsletter") || pathName.includes("contact")) {
    return { tier: "high", reason: "auth_or_lead_abuse_surface" };
  }
  if (pathName.includes("partner-image") || pathName.includes("media")) {
    return { tier: "high", reason: "ssrf_or_media_proxy_surface" };
  }
  if (signals.withRateLimit || signals.securityCriticalPolicy) {
    return { tier: "medium", reason: "rate_limited_public_mutation" };
  }
  return { tier: mutating ? "medium" : "low", reason: "general_api" };
}

function authPattern(route) {
  if (route.signals.authorizeAdminRequest || route.signals.authorizeStaffManagementRequest) {
    return "admin_session_or_automation";
  }
  if (route.signals.cronSecret) return "cron_secret";
  if (route.route.startsWith("/api/admin/")) return "admin_expected_but_unscanned";
  if (route.route.startsWith("/api/organizer/")) return "organizer_session_expected";
  if (route.route.startsWith("/api/privacy/") || route.route.startsWith("/api/profile/")) {
    return "user_session_expected";
  }
  return "public_or_mixed";
}

function rateLimitPattern(route) {
  if (route.signals.securityCriticalPolicy || route.signals.checkSecurityRateLimit) {
    return "security_critical";
  }
  if (route.signals.withRateLimit) return "standard";
  return "none_detected";
}

export function buildApiSecurityMatrix(root = ROOT) {
  const inventory = buildAttackSurfaceInventory(root);
  const rows = inventory.routes.map((route) => {
    const risk = riskTier(route);
    const mutating = route.methods.some((m) => ["POST", "PUT", "PATCH", "DELETE"].includes(m));
    return {
      route: route.route,
      sourceFile: route.sourceFile,
      methods: route.methods,
      riskTier: risk.tier,
      riskReason: risk.reason,
      authPattern: authPattern(route),
      rateLimit: rateLimitPattern(route),
      csrfNotes: route.signals.csrfNotes,
      bodyLimitDetected: route.signals.bodyLimit,
      privateNoStoreDetected: route.signals.privateNoStore,
      criticalAudit: route.signals.writeCriticalAdminAuditLog,
      bestEffortAudit: route.signals.writeAdminAuditLog,
      payloadNotes: route.signals.bodyLimit
        ? "content_length_or_limited_json_guard"
        : mutating
          ? "no_explicit_body_limit_detected"
          : "n_a_read_only",
      cachePrivacyNotes: route.signals.privateNoStore
        ? "private_no_store_header"
        : route.route.startsWith("/api/admin/") || route.route.startsWith("/api/organizer/")
          ? "review_authenticated_cache_headers"
          : "public_or_mixed",
    };
  });

  const byTier = rows.reduce((acc, row) => {
    acc[row.riskTier] = (acc[row.riskTier] ?? 0) + 1;
    return acc;
  }, {});

  return {
    schemaVersion: 1,
    kind: "api-security-matrix",
    generatedAt: new Date().toISOString(),
    evidenceLevel: "static_source",
    routeCount: rows.length,
    byTier,
    rows: rows.sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      return (order[a.riskTier] ?? 9) - (order[b.riskTier] ?? 9) || a.route.localeCompare(b.route);
    }),
  };
}

function main() {
  const matrix = buildApiSecurityMatrix(ROOT);
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true, mode: 0o700 });
  fs.writeFileSync(OUTPUT, `${JSON.stringify(matrix, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  console.log(
    JSON.stringify({
      status: "ok",
      routeCount: matrix.routeCount,
      byTier: matrix.byTier,
      output: path.relative(ROOT, OUTPUT),
    }),
  );
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
  main();
}
