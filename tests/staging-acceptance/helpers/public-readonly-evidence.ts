import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { APIRequestContext, Page, Request, Response, TestInfo } from "@playwright/test";

const CLEANUP_MANIFEST_PATH = "test-results/staging-acceptance/cleanup-manifest.json";
const READ_ONLY_NAMESPACE = "public-readonly:J01-J03";
const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const REQUEST_EVIDENCE_TYPES = new Set(["document", "fetch", "xhr"]);
const FORBIDDEN_ORDER_PATHS = [
  /\/api\/tripster\/booking-request(?:\/|$)/,
  /\/api\/youtravel\/booking-request(?:\/|$)/,
  /\/external_orders(?:\/|$)/,
];

type TrafficEntry = {
  method: string;
  path: string;
  resourceType: string;
  status: number | null;
};

export type ReadOnlyTraffic = {
  entries: TrafficEntry[];
  sameOriginWrites: TrafficEntry[];
  forbiddenWrites: TrafficEntry[];
  stop: () => void;
};

export type ReadOnlyCleanupManifest = {
  schemaVersion: 1;
  runId: string;
  namespace: string;
  scope: "public-read-only";
  status: "passed";
  orphanFixtures: 0;
  fixtureCount: 0;
  evidenceLevel: "no-fixtures-created";
  completedJourneys: string[];
  completedProjects: string[];
  generatedAt: string;
};

function jsonBody(value: unknown): Buffer {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function safePath(value: string, baseUrl: string): string | null {
  try {
    const url = new URL(value);
    if (url.origin !== new URL(baseUrl).origin) return null;
    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}

function requestEntry(request: Request, baseUrl: string): TrafficEntry | null {
  const requestPath = safePath(request.url(), baseUrl);
  if (!requestPath) return null;
  return {
    method: request.method(),
    path: requestPath,
    resourceType: request.resourceType(),
    status: null,
  };
}

function responseEntry(response: Response, baseUrl: string): TrafficEntry | null {
  const entry = requestEntry(response.request(), baseUrl);
  return entry ? { ...entry, status: response.status() } : null;
}

export function isForbiddenPartnerOrderWrite(method: string, value: string): boolean {
  if (!WRITE_METHODS.has(method.toUpperCase())) return false;
  try {
    const pathname = new URL(value).pathname;
    return FORBIDDEN_ORDER_PATHS.some((pattern) => pattern.test(pathname));
  } catch {
    return false;
  }
}

export function observeReadOnlyTraffic(page: Page, baseUrl: string): ReadOnlyTraffic {
  const entries: TrafficEntry[] = [];
  const sameOriginWrites: TrafficEntry[] = [];
  const forbiddenWrites: TrafficEntry[] = [];

  const onRequest = (request: Request) => {
    const sameOriginEntry = requestEntry(request, baseUrl);
    if (sameOriginEntry && WRITE_METHODS.has(sameOriginEntry.method)) {
      sameOriginWrites.push(sameOriginEntry);
    }
    if (isForbiddenPartnerOrderWrite(request.method(), request.url())) {
      const url = new URL(request.url());
      forbiddenWrites.push({
        method: request.method(),
        path: `${url.origin}${url.pathname}`,
        resourceType: request.resourceType(),
        status: null,
      });
    }
  };
  const onResponse = (response: Response) => {
    const entry = responseEntry(response, baseUrl);
    if (entry && REQUEST_EVIDENCE_TYPES.has(entry.resourceType)) entries.push(entry);
  };

  page.on("request", onRequest);
  page.on("response", onResponse);

  return {
    entries,
    sameOriginWrites,
    forbiddenWrites,
    stop: () => {
      page.off("request", onRequest);
      page.off("response", onResponse);
    },
  };
}

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values)].sort();
}

function priorManifest(root: string, runId: string): ReadOnlyCleanupManifest | null {
  const manifestPath = path.join(root, CLEANUP_MANIFEST_PATH);
  if (!fs.existsSync(manifestPath)) return null;
  try {
    const value = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as Partial<ReadOnlyCleanupManifest>;
    if (value.runId !== runId || value.namespace !== `${runId}:${READ_ONLY_NAMESPACE}`) return null;
    if (!Array.isArray(value.completedJourneys) || !Array.isArray(value.completedProjects)) return null;
    return value as ReadOnlyCleanupManifest;
  } catch {
    return null;
  }
}

export function buildReadOnlyCleanupManifest(input: {
  runId: string;
  journeyId: string;
  projectName: string;
  prior?: ReadOnlyCleanupManifest | null;
  now?: Date;
}): ReadOnlyCleanupManifest {
  const prior = input.prior?.runId === input.runId ? input.prior : null;
  return {
    schemaVersion: 1,
    runId: input.runId,
    namespace: `${input.runId}:${READ_ONLY_NAMESPACE}`,
    scope: "public-read-only",
    status: "passed",
    orphanFixtures: 0,
    fixtureCount: 0,
    evidenceLevel: "no-fixtures-created",
    completedJourneys: uniqueSorted([
      ...(prior?.completedJourneys ?? []),
      input.journeyId,
    ]),
    completedProjects: uniqueSorted([
      ...(prior?.completedProjects ?? []),
      input.projectName,
    ]),
    generatedAt: (input.now ?? new Date()).toISOString(),
  };
}

export function produceReadOnlyCleanupManifest(input: {
  root?: string;
  runId: string;
  journeyId: string;
  projectName: string;
}): ReadOnlyCleanupManifest {
  const root = input.root ?? process.cwd();
  const relativePath = CLEANUP_MANIFEST_PATH;
  const manifestPath = path.join(root, relativePath);
  const manifest = buildReadOnlyCleanupManifest({
    ...input,
    prior: priorManifest(root, input.runId),
  });
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  const temporaryPath = `${manifestPath}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(temporaryPath, jsonBody(manifest));
  fs.renameSync(temporaryPath, manifestPath);
  return manifest;
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

async function databaseProbe(request: APIRequestContext) {
  const [healthResponse, acceptanceResponse] = await Promise.all([
    request.get("/api/health"),
    request.get("/api/acceptance/environment"),
  ]);
  if (!healthResponse.ok()) {
    throw new Error(`health probe failed with HTTP ${healthResponse.status()}`);
  }
  if (!acceptanceResponse.ok()) {
    throw new Error(`acceptance environment probe failed with HTTP ${acceptanceResponse.status()}`);
  }

  const health = (await healthResponse.json()) as {
    gitSha?: unknown;
    migrationVersion?: unknown;
    checks?: {
      database?: { ok?: unknown; skipped?: unknown; latencyMs?: unknown; error?: unknown };
      migrations?: { latestId?: unknown; fileCount?: unknown };
    };
  };
  const acceptance = (await acceptanceResponse.json()) as {
    enabled?: unknown;
    supabaseProjectRef?: unknown;
    paymentSandbox?: unknown;
    disposableMailbox?: unknown;
    partnerWritesDisabled?: unknown;
  };

  const expectedProjectRef = process.env.STAGING_ACCEPTANCE_SUPABASE_PROJECT_REF?.trim();
  const expectedMigration = process.env.STAGING_ACCEPTANCE_MIGRATION_ID?.trim();
  if (health.checks?.database?.ok !== true || health.checks.database.skipped === true) {
    throw new Error("health probe did not confirm a live staging database connection");
  }
  if (health.migrationVersion !== expectedMigration) {
    throw new Error("health migrationVersion does not match the acceptance migration binding");
  }
  if (
    acceptance.enabled !== true ||
    acceptance.supabaseProjectRef !== expectedProjectRef ||
    acceptance.partnerWritesDisabled !== true
  ) {
    throw new Error("remote acceptance environment does not match the isolated staging binding");
  }

  return {
    boundary: "database",
    evidenceLevel: "health-and-environment-probe",
    readOnly: true,
    claim: "connectivity-and-staging-binding-only; no row, mutation, or RLS claim",
    health: {
      httpStatus: healthResponse.status(),
      gitSha: health.gitSha ?? null,
      migrationVersion: health.migrationVersion ?? null,
      database: health.checks?.database ?? null,
      migrations: health.checks?.migrations ?? null,
    },
    acceptance: {
      httpStatus: acceptanceResponse.status(),
      enabled: acceptance.enabled === true,
      projectRefHash: expectedProjectRef ? sha256(expectedProjectRef) : null,
      paymentSandbox: acceptance.paymentSandbox === true,
      disposableMailbox: acceptance.disposableMailbox === true,
      partnerWritesDisabled: acceptance.partnerWritesDisabled === true,
    },
  };
}

export async function attachPublicReadOnlyEvidence(input: {
  page: Page;
  request: APIRequestContext;
  testInfo: TestInfo;
  journeyId: "J01" | "J02" | "J03";
  traffic: ReadOnlyTraffic;
  browser: Record<string, unknown>;
}): Promise<void> {
  input.traffic.stop();
  if (input.traffic.sameOriginWrites.length > 0) {
    throw new Error(
      `read-only journey issued same-origin writes: ${JSON.stringify(input.traffic.sameOriginWrites)}`,
    );
  }
  if (input.traffic.forbiddenWrites.length > 0) {
    throw new Error(
      `forbidden partner order write observed: ${JSON.stringify(input.traffic.forbiddenWrites)}`,
    );
  }

  const screenshotPath = input.testInfo.outputPath(`${input.journeyId}-browser.png`);
  await input.page.screenshot({ path: screenshotPath, fullPage: false, animations: "disabled" });
  await input.testInfo.attach("browser", { path: screenshotPath, contentType: "image/png" });

  await input.testInfo.attach("request", {
    body: jsonBody({
      boundary: "request",
      evidenceLevel: "same-origin-response-log",
      readOnly: true,
      responses: input.traffic.entries,
      sameOriginWrites: input.traffic.sameOriginWrites,
      forbiddenPartnerOrderWrites: input.traffic.forbiddenWrites,
    }),
    contentType: "application/json",
  });

  await input.testInfo.attach("database", {
    body: jsonBody(await databaseProbe(input.request)),
    contentType: "application/json",
  });

  const cookies = await input.page.context().cookies();
  const authCookieNames = cookies
    .map((cookie) => cookie.name)
    .filter((name) => /^sb-.+-auth-token(?:\.|$)/.test(name));
  if (authCookieNames.length > 0) {
    throw new Error(`public journey unexpectedly has authenticated cookies: ${authCookieNames.join(", ")}`);
  }
  await input.testInfo.attach("roleVisibility", {
    body: jsonBody({
      boundary: "roleVisibility",
      evidenceLevel: "anonymous-public-visibility",
      role: "guest",
      authenticatedSession: false,
      authCookieCount: 0,
      comparison: "not-applicable: J01-J03 are public guest journeys",
      page: input.browser,
    }),
    contentType: "application/json",
  });

  const cleanup = produceReadOnlyCleanupManifest({
    runId: process.env.STAGING_ACCEPTANCE_RUN_ID?.trim() ?? "missing-run-id",
    journeyId: input.journeyId,
    projectName: input.testInfo.project.name,
  });
  await input.testInfo.attach("cleanup", {
    body: jsonBody({
      boundary: "cleanup",
      manifestPath: CLEANUP_MANIFEST_PATH,
      ...cleanup,
    }),
    contentType: "application/json",
  });
}
