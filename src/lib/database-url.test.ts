import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  isDatabaseUrlAttested,
  resolveDatabaseConnectionDiagnostics,
  resolveDatabaseUrl,
} from "./database-url";

const ORIGINAL = { ...process.env };
const EXPECTED_REF = "abcdefghijklmnopqrst";
const OTHER_REF = "zyxwvutsrqponmlkjihg";

afterEach(() => {
  process.env = { ...ORIGINAL };
});

function clearDatabaseEnvironment() {
  delete process.env.POSTGRES_URL;
  delete process.env.POSTGRES_PRISMA_URL;
  delete process.env.DATABASE_URL;
  delete process.env.POSTGRES_URL_NON_POOLING;
  delete process.env.POSTGRES_HOST;
  delete process.env.POSTGRES_USER;
  delete process.env.POSTGRES_PASSWORD;
  process.env.NEXT_PUBLIC_SUPABASE_URL = `https://${EXPECTED_REF}.supabase.co`;
}

describe("resolveDatabaseUrl", () => {
  it("skips an unattested higher-priority URL and selects the canonical candidate", () => {
    clearDatabaseEnvironment();
    process.env.POSTGRES_URL =
      "postgresql://user:pass@generic-postgres.example.com/postgres";
    process.env.DATABASE_URL =
      `postgresql://postgres:pass@db.${EXPECTED_REF}.supabase.co:5432/postgres`;

    expect(resolveDatabaseUrl()).toBe(process.env.DATABASE_URL);
    expect(resolveDatabaseConnectionDiagnostics()).toEqual({
      source: "DATABASE_URL",
      mode: "supabase_direct",
      port: 5432,
      projectRef: EXPECTED_REF,
      targetStatus: "verified",
    });
  });

  it("normalizes and accepts a matching Supavisor session target", () => {
    clearDatabaseEnvironment();
    process.env.POSTGRES_URL =
      `postgresql://postgres.${EXPECTED_REF}:pass@aws-0-region.pooler.supabase.com:6543/postgres`;

    expect(resolveDatabaseUrl()).toBe(
      `postgresql://postgres.${EXPECTED_REF}:pass@aws-0-region.pooler.supabase.com:5432/postgres`,
    );
    expect(resolveDatabaseConnectionDiagnostics()).toEqual({
      source: "POSTGRES_URL",
      mode: "supabase_session_pooler",
      port: 5432,
      projectRef: EXPECTED_REF,
      targetStatus: "verified",
    });
  });

  it("rejects a valid Supabase URL for another project", () => {
    clearDatabaseEnvironment();
    process.env.POSTGRES_URL =
      `postgresql://postgres.${OTHER_REF}:pass@aws-0-region.pooler.supabase.com:5432/postgres`;

    expect(resolveDatabaseUrl()).toBeNull();
    expect(resolveDatabaseConnectionDiagnostics()).toMatchObject({
      source: "POSTGRES_URL",
      projectRef: OTHER_REF,
      targetStatus: "mismatch",
    });
  });

  it("rejects a generic target whose project identity cannot be attested", () => {
    clearDatabaseEnvironment();
    process.env.POSTGRES_URL =
      "postgresql://user:provider-secret@generic-postgres.example.com/postgres";

    expect(resolveDatabaseUrl()).toBeNull();
    const diagnostics = resolveDatabaseConnectionDiagnostics();
    expect(diagnostics).toMatchObject({
      source: "POSTGRES_URL",
      mode: "other",
      projectRef: null,
      targetStatus: "unverified",
    });
    expect(JSON.stringify(diagnostics)).not.toContain("provider-secret");
    expect(JSON.stringify(diagnostics)).not.toContain("generic-postgres.example.com");
  });

  it("does not trust a canonical-looking username on a non-Supabase host", () => {
    clearDatabaseEnvironment();
    process.env.POSTGRES_URL =
      `postgresql://postgres.${EXPECTED_REF}:pass@generic-postgres.example.com:5432/postgres`;

    expect(resolveDatabaseUrl()).toBeNull();
    expect(resolveDatabaseConnectionDiagnostics()).toMatchObject({
      mode: "other",
      projectRef: null,
      targetStatus: "unverified",
    });
  });

  it("rejects direct Postgres when the public Supabase identity is absent", () => {
    clearDatabaseEnvironment();
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.DATABASE_URL =
      `postgresql://postgres:pass@db.${EXPECTED_REF}.supabase.co:5432/postgres`;

    expect(resolveDatabaseUrl()).toBeNull();
    expect(resolveDatabaseConnectionDiagnostics()?.targetStatus).toBe("unverified");
    expect(isDatabaseUrlAttested(process.env.DATABASE_URL)).toBe(false);
  });

  it("reports a safe verified fingerprint without credentials or host", () => {
    clearDatabaseEnvironment();
    process.env.DATABASE_URL =
      `postgresql://postgres.${EXPECTED_REF}:super-secret@aws-0-sa-east-1.pooler.supabase.com:5432/postgres`;

    const diagnostics = resolveDatabaseConnectionDiagnostics();
    expect(diagnostics).toEqual({
      source: "DATABASE_URL",
      mode: "supabase_session_pooler",
      port: 5432,
      projectRef: EXPECTED_REF,
      targetStatus: "verified",
    });
    expect(isDatabaseUrlAttested(process.env.DATABASE_URL)).toBe(true);
    expect(JSON.stringify(diagnostics)).not.toContain("super-secret");
    expect(JSON.stringify(diagnostics)).not.toContain("aws-0-sa-east-1");
  });
});
