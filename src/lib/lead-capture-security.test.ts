import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("lead capture Data API security", () => {
  it("routes public writes through the server API instead of direct table inserts", () => {
    const migration = fs.readFileSync(
      path.join(
        process.cwd(),
        "supabase/migrations/20260716195433_lock_lead_capture_to_server_api.sql",
      ),
      "utf8",
    );

    for (const table of ["newsletter_subscribers", "contact_submissions"]) {
      expect(migration).toContain(`revoke insert on table public.${table} from anon, authenticated`);
      expect(migration).toContain(
        `grant select, insert, update, delete on table public.${table} to service_role`,
      );
    }
    expect(migration).toContain('drop policy if exists "newsletter_anon_insert"');
    expect(migration).toContain('drop policy if exists "contact_anon_insert"');
  });
});
