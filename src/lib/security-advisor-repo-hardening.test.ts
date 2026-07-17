import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const migrationPath = path.join(
  root,
  "supabase/migrations/20260717035000_security_advisor_repo_owned_hardening.sql",
);
const migration = fs.readFileSync(migrationPath, "utf8");
const runtimeSources = ["src", "scripts"]
  .flatMap((directory) => collectRuntimeSources(path.join(root, directory)))
  .map((filePath) => fs.readFileSync(filePath, "utf8"))
  .join("\n");

const TRIGGER_ONLY_FUNCTIONS = [
  "public.handle_new_user()",
  "public.protect_profile_sensitive_fields()",
  "public.touch_conversation_thread_on_message()",
  "public.touch_forum_thread_on_post()",
] as const;

function collectRuntimeSources(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectRuntimeSources(entryPath);
    if (!entry.isFile() || !/\.(?:ts|tsx|mjs)$/.test(entry.name) || entry.name.includes(".test.")) {
      return [];
    }
    return [entryPath];
  });
}

describe("repo-owned Supabase Security Advisor hardening", () => {
  it("removes direct Data API execution from every repo-owned trigger-only definer", () => {
    for (const signature of TRIGGER_ONLY_FUNCTIONS) {
      const functionName = signature.slice("public.".length, -2);
      expect(migration).toContain(
        `revoke execute on function ${signature}\n  from public, anon, authenticated;`,
      );
      expect(migration).toContain(
        `grant execute on function ${signature}\n  to service_role;`,
      );
      expect(runtimeSources).not.toMatch(
        new RegExp(`\\.rpc\\(\\s*["']${functionName}["']`),
      );
    }
  });

  it("removes anonymous object listing while preserving authenticated owner/staff listing", () => {
    expect(migration).toContain(
      'drop policy if exists "cms_media_select_public" on storage.objects;',
    );
    expect(migration).toContain(
      'create policy "cms_media_select_staff"',
    );
    expect(migration).toContain("public.is_admin_with('content.edit')");

    expect(migration).toContain(
      'drop policy if exists "organizer_products_select_public" on storage.objects;',
    );
    expect(migration).toContain(
      'create policy "organizer_products_select_owner_or_staff"',
    );
    expect(migration).toContain(
      "(storage.foldername(name))[1] = (select auth.uid())::text",
    );

    expect(migration).not.toMatch(/create policy[\s\S]*for select[\s\S]*to anon/i);
    expect(migration).not.toMatch(/update storage\.buckets[\s\S]*public\s*=\s*false/i);
  });

  it("does not invent DDL for live-only advisor objects", () => {
    expect(migration).not.toContain("brand-assets");
    expect(migration).not.toContain("product-media");
    expect(migration).not.toMatch(/workshop|storefront/i);
  });
});
