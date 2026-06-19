#!/usr/bin/env node
/**
 * Удаляет всех пользователей Supabase Auth (и profiles через ON DELETE CASCADE).
 *
 * Usage:
 *   npm run supabase:purge-auth -- --yes
 *   npm run supabase:purge-auth -- --yes --email=user@example.com
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function loadEnvLocal() {
  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

function parseArgs(argv) {
  const confirmed = argv.includes("--yes");
  const emailArg = argv.find((arg) => arg.startsWith("--email="));
  const email = emailArg ? emailArg.slice("--email=".length).trim().toLowerCase() : null;
  return { confirmed, email };
}

async function listAllUsers(admin) {
  const users = [];
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const batch = data.users ?? [];
    users.push(...batch);
    if (batch.length < perPage) break;
    page += 1;
  }

  return users;
}

async function main() {
  loadEnvLocal();

  const { confirmed, email } = parseArgs(process.argv.slice(2));
  if (!confirmed) {
    console.error("Refusing to run without --yes");
    console.error("Example: npm run supabase:purge-auth -- --yes");
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) {
    throw new Error("Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
  }

  const admin = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const allUsers = await listAllUsers(admin);
  const targets = email
    ? allUsers.filter((user) => user.email?.trim().toLowerCase() === email)
    : allUsers;

  if (targets.length === 0) {
    console.log(email ? `No auth users found for ${email}` : "No auth users found");
    return;
  }

  console.log(`Deleting ${targets.length} auth user(s)…`);

  let deleted = 0;
  let failed = 0;

  for (const user of targets) {
    const label = user.email ?? user.id;
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) {
      failed += 1;
      console.error(`  ✗ ${label}: ${error.message}`);
    } else {
      deleted += 1;
      console.log(`  ✓ ${label}`);
    }
  }

  const { count: profileCount, error: profileCountError } = await admin
    .from("profiles")
    .select("*", { count: "exact", head: true });

  if (profileCountError) {
    console.warn(`Could not count profiles: ${profileCountError.message}`);
  } else {
    console.log(`Profiles remaining: ${profileCount ?? 0}`);
  }

  console.log(`Done. Deleted: ${deleted}, failed: ${failed}`);
  console.log("");
  console.log("In the browser, also clear local session (DevTools → Console):");
  console.log(
    "  ['argentina-travel-auth-session','argentina-travel-auth-users','argentina-travel-auth-overrides','argentina-travel-bookings'].forEach(k => localStorage.removeItem(k)); location.reload();"
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
