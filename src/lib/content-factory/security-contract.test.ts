import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const migration = fs.readFileSync(
  path.join(root, "supabase/migrations/20260719174112_content_factory_control_plane.sql"),
  "utf8",
);
const operatingSystemMigration = fs.readFileSync(
  path.join(root, "supabase/migrations/20260719182515_content_factory_operating_system.sql"),
  "utf8",
);
const adminRoute = fs.readFileSync(
  path.join(root, "src/app/api/admin/content-factory/route.ts"),
  "utf8",
);
const webhooks = fs.readFileSync(
  path.join(root, "src/lib/content-factory/webhooks.ts"),
  "utf8",
);
const whatsappWebhookRoute = fs.readFileSync(
  path.join(root, "src/app/api/webhooks/meta/whatsapp/route.ts"),
  "utf8",
);

describe("content factory security contract", () => {
  it("keeps all control-plane tables behind RLS and service-role grants", () => {
    for (const table of [
      "social_channel_connections",
      "social_channel_secrets",
      "content_factory_items",
      "content_factory_variants",
      "content_publication_jobs",
      "social_inbox_threads",
      "social_inbox_messages",
    ]) {
      expect(migration).toContain(`alter table public.${table} enable row level security`);
      expect(migration).toContain(`on public.${table} for all to service_role`);
      expect(migration).toContain(`revoke all on public.${table} from public, anon, authenticated`);
      expect(migration).toContain(`on public.${table} to service_role`);
    }
  });

  it("stores credentials in Vault and exposes the read RPC only to service_role", () => {
    expect(migration).toContain("vault.create_secret");
    expect(migration).toContain("vault.update_secret");
    expect(migration).toContain("join vault.decrypted_secrets");
    expect(migration).toContain("content_factory_get_connection_credentials(text, text)\n  from public, anon, authenticated");
    expect(migration).toContain("content_factory_get_connection_credentials(text, text)\n  to service_role");
  });

  it("keeps campaigns, templates, AI runs, and metrics server-only", () => {
    for (const table of [
      "content_factory_campaigns",
      "content_factory_templates",
      "content_factory_generation_runs",
      "content_factory_metric_snapshots",
    ]) {
      expect(operatingSystemMigration).toContain(`alter table public.${table} enable row level security`);
      expect(operatingSystemMigration).toContain(`on public.${table} for all to service_role`);
      expect(operatingSystemMigration).toContain(`revoke all on public.${table} from public, anon, authenticated`);
      expect(operatingSystemMigration).toContain(`on public.${table} to service_role`);
    }
  });

  it("never writes submitted secrets into the admin audit payload", () => {
    expect(adminRoute).not.toMatch(/payload:\s*\{[^}]*secrets/);
    expect(adminRoute).not.toMatch(/payload:\s*\{[^}]*access_token/);
  });

  it("requires the Meta HMAC signature before ingesting messages", () => {
    expect(whatsappWebhookRoute).toContain("x-hub-signature-256");
    expect(webhooks).toContain("createHmac(\"sha256\"");
    expect(webhooks).toContain("timingSafeEqual");
  });
});
