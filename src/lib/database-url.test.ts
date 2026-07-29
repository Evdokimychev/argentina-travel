import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { resolveDatabaseConnectionDiagnostics, resolveDatabaseUrl } from "./database-url";

const ORIGINAL = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL };
});

describe("resolveDatabaseUrl", () => {
  it("prefers the Supabase session pooler over an unreachable direct URL", () => {
    process.env.DATABASE_URL = "postgresql://user:pass@db.project.supabase.co:5432/postgres";
    process.env.POSTGRES_URL =
      "postgresql://user:pass@aws-0-region.pooler.supabase.com:6543/postgres";

    expect(resolveDatabaseUrl()).toBe(
      "postgresql://user:pass@aws-0-region.pooler.supabase.com:5432/postgres",
    );
    expect(resolveDatabaseConnectionDiagnostics()).toEqual({
      source: "POSTGRES_URL",
      mode: "supabase_session_pooler",
      port: 5432,
      projectRef: null,
    });
  });

  it("reports a safe target fingerprint without credentials or host", () => {
    delete process.env.POSTGRES_URL;
    delete process.env.POSTGRES_PRISMA_URL;
    process.env.DATABASE_URL =
      "postgresql://postgres.uooxrypocahomoqzdvzy:super-secret@aws-0-sa-east-1.pooler.supabase.com:5432/postgres";

    const diagnostics = resolveDatabaseConnectionDiagnostics();
    expect(diagnostics).toEqual({
      source: "DATABASE_URL",
      mode: "supabase_session_pooler",
      port: 5432,
      projectRef: "uooxrypocahomoqzdvzy",
    });
    expect(JSON.stringify(diagnostics)).not.toContain("super-secret");
    expect(JSON.stringify(diagnostics)).not.toContain("aws-0-sa-east-1");
  });
});
