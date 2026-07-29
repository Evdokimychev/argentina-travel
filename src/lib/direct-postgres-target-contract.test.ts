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
});
