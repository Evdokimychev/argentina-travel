#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import {
  parseSupabaseDatabaseTarget,
  supabaseProjectRefFromUrl,
} from "./lib/database-target-attestation.mjs";

function loadEnvFile(filename) {
  if (!fs.existsSync(filename)) return;
  for (const line of fs.readFileSync(filename, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index < 0) continue;
    const key = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();
    try { value = JSON.parse(value); } catch {}
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(path.resolve(".env.local"));

const canonicalSiteUrl = "https://www.goargentina.ru";
const expectedProjectRef = process.env.EXPECTED_SUPABASE_PROJECT_REF ?? "uooxrypocahomoqzdvzy";

const refFromUrl = (value) => supabaseProjectRefFromUrl(value);
const refFromJwt = (value) => {
  try {
    const payload = JSON.parse(Buffer.from(value.split(".")[1], "base64url"));
    return payload.ref ?? refFromUrl(payload.iss);
  } catch { return null; }
};
const refFromDatabase = (value) => parseSupabaseDatabaseTarget(value).projectRef;

const refs = {
  publicUrl: refFromUrl(process.env.NEXT_PUBLIC_SUPABASE_URL),
  anonKey: refFromJwt(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  serviceRole: refFromJwt(process.env.SUPABASE_SERVICE_ROLE_KEY),
  database: refFromDatabase(process.env.DATABASE_URL),
};
const missing = Object.entries(refs).filter(([, value]) => !value).map(([key]) => key);
const uniqueRefs = new Set(Object.values(refs).filter(Boolean));
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
const environment = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "local";
const errors = [];
if (missing.length) errors.push(`Не определены: ${missing.join(", ")}`);
if (uniqueRefs.size > 1) errors.push("Supabase-переменные относятся к разным проектам");
if (uniqueRefs.size === 1 && !uniqueRefs.has(expectedProjectRef)) {
  errors.push(`Supabase project ref должен быть ${expectedProjectRef}`);
}
if (environment === "production" && siteUrl !== canonicalSiteUrl) {
  errors.push(`NEXT_PUBLIC_SITE_URL должен быть ${canonicalSiteUrl}`);
}

console.log(`Auth environment: ${environment}`);
console.log(`Supabase project ref: ${uniqueRefs.size === 1 ? [...uniqueRefs][0] : "mismatch"}`);
console.log(`Expected project ref: ${expectedProjectRef}`);
console.log(`Canonical site URL: ${siteUrl ?? "not set"}`);
console.log(`Release SHA: ${process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? "local"}`);
console.log(`Supabase Auth: ${process.env.NEXT_PUBLIC_SUPABASE_AUTH === "false" ? "disabled" : "enabled"}`);
if (errors.length) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  process.exit(1);
}
console.log("Auth readiness: OK");
