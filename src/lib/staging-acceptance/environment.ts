import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {
  supabaseProjectRefFromDatabaseUrl,
  supabaseProjectRefFromUrl,
} from "@/lib/supabase/project-ref";

export {
  supabaseProjectRefFromDatabaseUrl,
  supabaseProjectRefFromUrl,
} from "@/lib/supabase/project-ref";

export const PRODUCTION_SUPABASE_PROJECT_REF = "uooxrypocahomoqzdvzy";
export const PRODUCTION_ORIGINS = [
  "https://www.goargentina.ru",
  "https://goargentina.ru",
] as const;

export type AcceptanceEnvironment = Readonly<{
  baseUrl: string;
  supabaseUrl: string;
  supabaseProjectRef: string;
  runId: string;
  mailMode: "disposable";
  paymentSandbox: true;
  partnerWrites: false;
}>;

export type AcceptanceFingerprint = AcceptanceEnvironment &
  Readonly<{
    gitSha: string;
    migrationFingerprint: string;
  }>;

type EnvironmentLike = Record<string, string | undefined>;

function required(env: EnvironmentLike, key: string): string {
  const value = env[key]?.trim();
  if (!value) throw new Error(`[staging-acceptance] ${key} is required`);
  return value;
}

function parseHttpsOrigin(value: string, key: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`[staging-acceptance] ${key} must be an absolute URL`);
  }
  if (parsed.protocol !== "https:") {
    throw new Error(`[staging-acceptance] ${key} must use HTTPS`);
  }
  if (parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error(`[staging-acceptance] ${key} must not contain credentials, query, or hash`);
  }
  return parsed;
}

export function supabaseProjectRefFromJwt(value: string): string | null {
  if (!value.startsWith("eyJ")) return null;
  try {
    const payload = JSON.parse(Buffer.from(value.split(".")[1], "base64url").toString("utf8")) as {
      ref?: unknown;
      iss?: unknown;
    };
    if (typeof payload.ref === "string") return payload.ref;
    return typeof payload.iss === "string" ? supabaseProjectRefFromUrl(payload.iss) : null;
  } catch {
    return null;
  }
}

export function assertStagingEnvironment(env: EnvironmentLike): AcceptanceEnvironment {
  if (env.STAGING_ACCEPTANCE_ENABLED !== "true") {
    throw new Error("[staging-acceptance] STAGING_ACCEPTANCE_ENABLED must be exactly true");
  }

  const baseUrl = parseHttpsOrigin(
    required(env, "STAGING_ACCEPTANCE_BASE_URL"),
    "STAGING_ACCEPTANCE_BASE_URL",
  );
  const baseOrigin = baseUrl.origin.toLowerCase();
  if (PRODUCTION_ORIGINS.includes(baseOrigin as (typeof PRODUCTION_ORIGINS)[number])) {
    throw new Error("[staging-acceptance] production base URL is forbidden");
  }
  if (baseUrl.hostname === "goargentina.ru" || baseUrl.hostname.endsWith(".goargentina.ru")) {
    throw new Error("[staging-acceptance] production domain is forbidden");
  }
  if (baseUrl.hostname === "localhost" || baseUrl.hostname === "127.0.0.1") {
    throw new Error("[staging-acceptance] a remote isolated staging URL is required");
  }

  const supabaseUrl = parseHttpsOrigin(
    required(env, "STAGING_ACCEPTANCE_SUPABASE_URL"),
    "STAGING_ACCEPTANCE_SUPABASE_URL",
  );
  const explicitProjectRef = required(env, "STAGING_ACCEPTANCE_SUPABASE_PROJECT_REF");
  const urlProjectRef = supabaseProjectRefFromUrl(supabaseUrl.origin);
  if (!urlProjectRef) {
    throw new Error("[staging-acceptance] STAGING_ACCEPTANCE_SUPABASE_URL is not a project API URL");
  }
  if (urlProjectRef !== explicitProjectRef) {
    throw new Error("[staging-acceptance] Supabase URL and explicit project ref do not match");
  }
  if (explicitProjectRef === PRODUCTION_SUPABASE_PROJECT_REF) {
    throw new Error("[staging-acceptance] production Supabase project ref is forbidden");
  }
  if (
    env.PRODUCTION_SUPABASE_PROJECT_REF?.trim() &&
    explicitProjectRef === env.PRODUCTION_SUPABASE_PROJECT_REF.trim()
  ) {
    throw new Error("[staging-acceptance] staging and configured production project refs match");
  }

  const configuredRefs = [
    ["NEXT_PUBLIC_SUPABASE_URL", env.NEXT_PUBLIC_SUPABASE_URL, supabaseProjectRefFromUrl],
    ["SUPABASE_URL", env.SUPABASE_URL, supabaseProjectRefFromUrl],
    ["DATABASE_URL", env.DATABASE_URL, supabaseProjectRefFromDatabaseUrl],
    ["NEXT_PUBLIC_SUPABASE_ANON_KEY", env.NEXT_PUBLIC_SUPABASE_ANON_KEY, supabaseProjectRefFromJwt],
    ["SUPABASE_SERVICE_ROLE_KEY", env.SUPABASE_SERVICE_ROLE_KEY, supabaseProjectRefFromJwt],
  ] as const;
  for (const [key, value, parseRef] of configuredRefs) {
    if (!value?.trim()) continue;
    const configuredRef = parseRef(value);
    if (configuredRef && configuredRef !== explicitProjectRef) {
      throw new Error(`[staging-acceptance] ${key} points to another Supabase project`);
    }
  }
  if (env.SUPABASE_PROJECT_REF?.trim() && env.SUPABASE_PROJECT_REF.trim() !== explicitProjectRef) {
    throw new Error("[staging-acceptance] SUPABASE_PROJECT_REF points to another project");
  }

  if (env.STAGING_ACCEPTANCE_MAILBOX_MODE !== "disposable") {
    throw new Error("[staging-acceptance] disposable mailbox mode is required");
  }
  required(env, "STAGING_ACCEPTANCE_MAILBOX_TOKEN");
  required(env, "NEXT_PUBLIC_SUPABASE_ANON_KEY");
  required(env, "SUPABASE_SERVICE_ROLE_KEY");
  if (env.PAYMENT_SANDBOX_MODE !== "true") {
    throw new Error("[staging-acceptance] PAYMENT_SANDBOX_MODE must be exactly true");
  }
  if (env.STAGING_ACCEPTANCE_PARTNER_WRITES !== "false") {
    throw new Error("[staging-acceptance] partner writes must be explicitly disabled");
  }

  return {
    baseUrl: baseOrigin,
    supabaseUrl: supabaseUrl.origin,
    supabaseProjectRef: explicitProjectRef,
    runId: required(env, "STAGING_ACCEPTANCE_RUN_ID"),
    mailMode: "disposable",
    paymentSandbox: true,
    partnerWrites: false,
  };
}

function gitSha(root: string, env: EnvironmentLike): string {
  const fromEnv =
    env.VERCEL_GIT_COMMIT_SHA?.trim() ||
    env.GITHUB_SHA?.trim() ||
    (env.CI ? env.GIT_SHA?.trim() : null);
  if (fromEnv) return fromEnv;
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
}

export function migrationSetFingerprint(root = process.cwd()): string {
  const directory = path.join(root, "supabase", "migrations");
  const hash = createHash("sha256");
  if (!fs.existsSync(directory)) return "none";
  for (const filename of fs.readdirSync(directory).filter((name) => name.endsWith(".sql")).sort()) {
    hash.update(filename);
    hash.update("\0");
    hash.update(fs.readFileSync(path.join(directory, filename)));
    hash.update("\0");
  }
  return hash.digest("hex");
}

export function createSafeFingerprint(
  env: EnvironmentLike,
  root = process.cwd(),
): AcceptanceFingerprint {
  return {
    ...assertStagingEnvironment(env),
    gitSha: gitSha(root, env),
    migrationFingerprint: migrationSetFingerprint(root),
  };
}
