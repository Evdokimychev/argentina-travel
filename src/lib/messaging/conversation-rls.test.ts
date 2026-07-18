import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("conversation participant RLS", () => {
  it("removes direct authenticated insert and update access", () => {
    const sql = readFileSync(
      join(process.cwd(), "supabase/migrations/20260715130000_lock_conversation_participants.sql"),
      "utf8"
    );

    expect(sql).toContain('drop policy if exists "conversation_threads_insert_participant"');
    expect(sql).toContain('drop policy if exists "conversation_threads_update_participant"');
    expect(sql).toContain("revoke insert, update, delete");
  });
});
