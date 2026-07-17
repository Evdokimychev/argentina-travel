import { expect, test } from "@playwright/test";

test("read-only staging health identifies the deployed revision", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBe(true);

  const body = (await response.json()) as { gitSha?: unknown };
  expect(typeof body.gitSha).toBe("string");
  if (process.env.GIT_SHA) expect(body.gitSha).toBe(process.env.GIT_SHA);
});

test("remote app confirms the same isolated Supabase and sandbox modes", async ({ request }) => {
  const response = await request.get("/api/acceptance/environment");
  expect(response.ok()).toBe(true);

  const body = (await response.json()) as {
    enabled?: unknown;
    gitSha?: unknown;
    supabaseProjectRef?: unknown;
    paymentSandbox?: unknown;
    disposableMailbox?: unknown;
    partnerWritesDisabled?: unknown;
  };
  expect(body).toMatchObject({
    enabled: true,
    supabaseProjectRef: process.env.STAGING_ACCEPTANCE_SUPABASE_PROJECT_REF,
    paymentSandbox: true,
    disposableMailbox: true,
    partnerWritesDisabled: true,
  });
  if (process.env.GIT_SHA) expect(body.gitSha).toBe(process.env.GIT_SHA);
});
