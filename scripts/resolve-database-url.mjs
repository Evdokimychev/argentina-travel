/**
 * Shared Postgres URL resolver for Node scripts (mirrors src/lib/database-url.ts).
 */
import {
  resolveAttestedDatabaseUrl,
  resolveTrustedSupabaseProjectRef,
} from "./lib/database-target-attestation.mjs";

export function resolveDatabaseConnection(env = process.env, options = {}) {
  const expectedProjectRef =
    options.expectedProjectRef ?? resolveTrustedSupabaseProjectRef(env);
  return resolveAttestedDatabaseUrl(env, {
    expectedProjectRef,
    purpose: options.purpose ?? "operational script",
    allowLocal: options.allowLocal ?? false,
  });
}

export function resolveDatabaseUrl(env = process.env, options = {}) {
  return resolveDatabaseConnection(env, options)?.connectionString ?? null;
}
