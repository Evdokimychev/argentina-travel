import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("direct Postgres target attestation", () => {
  it("routes auth-session mutation and RLS audit through the attested resolver", () => {
    for (const relativePath of [
      "src/lib/auth-sessions.ts",
      "src/lib/supabase/rls-audit.ts",
    ]) {
      const contents = source(relativePath);
      expect(contents).toContain("resolveDatabaseUrl()");
      expect(contents).not.toContain("process.env.DATABASE_URL");
    }
  });

  it("does not enable Prisma reads from an unattested DATABASE_URL", () => {
    const contents = source("src/lib/prisma.ts");
    expect(contents).toContain("isDatabaseUrlAttested(process.env.DATABASE_URL)");
    expect(contents).not.toContain("Boolean(process.env.DATABASE_URL)");
  });

  it("shares one attested bounded pool across partner fallback repositories", () => {
    const pool = source("src/lib/partner-pg-pool.ts");
    expect(pool).toContain("resolveDatabaseConnection()");
    expect(pool).toContain("new pg.Pool");
    expect(pool).toContain("PARTNER_PG_POOL_MAX = 2");
    expect(pool).toContain("statement_timeout: PARTNER_PG_QUERY_TIMEOUT_MS");

    for (const relativePath of [
      "src/lib/tripster/partner-tour-pg-repository.ts",
      "src/lib/tripster/pg-repository.ts",
      "src/lib/sputnik8/pg-repository.ts",
      "src/lib/youtravel/partner-tour-pg-repository.ts",
    ]) {
      const contents = source(relativePath);
      expect(contents).toContain("withPartnerPgClient");
      expect(contents).not.toContain("new pg.Client");
    }
  });
});
