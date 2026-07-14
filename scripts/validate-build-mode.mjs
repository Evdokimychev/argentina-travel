#!/usr/bin/env node

function normalized(name) {
  return process.env[name]?.trim().toLowerCase() ?? "";
}

export function validateBuildMode() {
  const deployEnv = normalized("DEPLOY_ENV");
  const vercelEnv = normalized("VERCEL_ENV");
  const configuredMode = normalized("NEXT_PUBLIC_APP_MODE");
  const isolatedDemo =
    normalized("DEMO_DEPLOYMENT") === "true" && configuredMode === "demo";
  const productionTarget =
    !isolatedDemo &&
    (normalized("BUILD_TARGET") === "production" ||
      deployEnv === "production" ||
      deployEnv === "staging" ||
      vercelEnv === "production" ||
      Boolean(process.env.CI));
  const mode = configuredMode || (productionTarget ? "production" : "demo");
  const errors = [];

  if (mode !== "production" && mode !== "demo") {
    errors.push("NEXT_PUBLIC_APP_MODE must be production or demo");
  }

  if (mode === "demo" && !isolatedDemo) {
    errors.push("demo mode requires DEMO_DEPLOYMENT=true and a separate deployment");
  }

  if (productionTarget) {
    if (mode !== "production") errors.push("production/staging build cannot use demo mode");
    if (normalized("NEXT_PUBLIC_ENABLE_DEMO_SEED") === "true") {
      errors.push("NEXT_PUBLIC_ENABLE_DEMO_SEED must not be true");
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) {
      errors.push("NEXT_PUBLIC_SUPABASE_URL is required");
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()) {
      errors.push("NEXT_PUBLIC_SUPABASE_ANON_KEY is required");
    }
    if (normalized("NEXT_PUBLIC_SUPABASE_AUTH") === "false") {
      errors.push("NEXT_PUBLIC_SUPABASE_AUTH must not be false");
    }
    if (normalized("NEXT_PUBLIC_TOURS_SOURCE") === "hybrid") {
      errors.push("NEXT_PUBLIC_TOURS_SOURCE=hybrid is forbidden in production/staging");
    }
  }

  if (errors.length > 0) {
    throw new Error(`Unsafe build configuration:\n- ${errors.join("\n- ")}`);
  }

  console.log(`Application mode: ${mode}${productionTarget ? " (protected build)" : ""}`);
  return { mode, productionTarget };
}

if (process.argv[1]?.endsWith("validate-build-mode.mjs")) {
  try {
    validateBuildMode();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
