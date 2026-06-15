#!/usr/bin/env node
/**
 * Resolve a working Supabase Postgres URL when direct db.* host is IPv6-only.
 * Tries Session pooler across common regions using credentials from DATABASE_URL.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const POOLER_REGIONS = [
  "sa-east-1",
  "us-east-1",
  "us-east-2",
  "us-west-1",
  "us-west-2",
  "eu-west-1",
  "eu-west-2",
  "eu-west-3",
  "eu-central-1",
  "eu-north-1",
  "ap-southeast-1",
  "ap-southeast-2",
  "ap-northeast-1",
  "ap-south-1",
  "ca-central-1",
];

const POOLER_PREFIXES = ["aws-0", "aws-1"];

function loadEnvLocal() {
  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

function parseDirectUrl(connectionString) {
  const url = new URL(connectionString);
  const projectRef = url.hostname.match(/^db\.([^.]+)\.supabase\.co$/)?.[1];
  if (!projectRef) return null;
  return {
    projectRef,
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, "") || "postgres",
  };
}

function buildPoolerUrl({ projectRef, password, database }, region, port) {
  const user = `postgres.${projectRef}`;
  const host = `aws-0-${region}.pooler.supabase.com`;
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
}

async function tryConnect(connectionString, timeoutMs = 8000) {
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: timeoutMs,
  });
  try {
    await client.connect();
    await client.query("select 1 as ok");
    await client.end();
    return true;
  } catch {
    try {
      await client.end();
    } catch {
      /* ignore */
    }
    return false;
  }
}

export async function resolveSupabaseDatabaseUrl(connectionString) {
  if (await tryConnect(connectionString)) {
    return connectionString;
  }

  const parsed = parseDirectUrl(connectionString);
  if (!parsed) {
    throw new Error("DATABASE_URL is not a direct db.<ref>.supabase.co URL; cannot derive pooler fallback");
  }

  const transactionUrl = `postgresql://${encodeURIComponent("postgres")}:${encodeURIComponent(parsed.password)}@db.${parsed.projectRef}.supabase.co:6543/${parsed.database}`;
  if (await tryConnect(transactionUrl)) {
    return transactionUrl;
  }

  for (const prefix of POOLER_PREFIXES) {
    for (const region of POOLER_REGIONS) {
      for (const port of [5432, 6543]) {
        const host = `${prefix}-${region}.pooler.supabase.com`;
        const user = `postgres.${parsed.projectRef}`;
        const candidate = `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(parsed.password)}@${host}:${port}/${parsed.database}`;
        if (await tryConnect(candidate)) {
          return candidate;
        }
      }
    }
  }

  throw new Error(
    "Could not connect via direct DATABASE_URL or Session pooler. Copy Session pooler URI from Supabase Dashboard → Database."
  );
}

async function main() {
  loadEnvLocal();
  const direct = process.env.DATABASE_URL?.trim();
  if (!direct) throw new Error("DATABASE_URL missing");

  const resolved = await resolveSupabaseDatabaseUrl(direct);
  if (resolved === direct) {
    console.log("DATABASE_URL: direct connection ok");
  } else {
    console.log("DATABASE_URL: use pooler fallback");
    console.log(resolved);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message ?? error);
    process.exit(1);
  });
}
