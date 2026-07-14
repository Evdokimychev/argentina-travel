import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { resolveDatabaseUrl } from "./database-url";

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
  });
});
