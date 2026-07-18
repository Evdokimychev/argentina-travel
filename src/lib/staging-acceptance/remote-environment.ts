import {
  PRODUCTION_SUPABASE_PROJECT_REF,
  supabaseProjectRefFromDatabaseUrl,
  supabaseProjectRefFromJwt,
  supabaseProjectRefFromUrl,
} from "./environment";

type EnvironmentLike = Record<string, string | undefined>;

export type RemoteAcceptanceSnapshot = Readonly<{
  enabled: true;
  gitSha: string | null;
  supabaseProjectRef: string;
  paymentSandbox: boolean;
  disposableMailbox: boolean;
  partnerWritesDisabled: boolean;
}>;

export function resolveRemoteAcceptanceSnapshot(
  env: EnvironmentLike,
): RemoteAcceptanceSnapshot | null {
  if (env.STAGING_ACCEPTANCE_ENABLED !== "true") return null;

  const refs = [
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_URL,
    env.STAGING_ACCEPTANCE_SUPABASE_URL,
  ]
    .filter((value): value is string => Boolean(value?.trim()))
    .map(supabaseProjectRefFromUrl);
  const databaseRef = env.DATABASE_URL?.trim()
    ? supabaseProjectRefFromDatabaseUrl(env.DATABASE_URL)
    : null;
  const keyRefs = [env.NEXT_PUBLIC_SUPABASE_ANON_KEY, env.SUPABASE_SERVICE_ROLE_KEY]
    .filter((value): value is string => Boolean(value?.trim()))
    .map(supabaseProjectRefFromJwt)
    .filter((ref): ref is string => Boolean(ref));
  const explicitRef = env.STAGING_ACCEPTANCE_SUPABASE_PROJECT_REF?.trim();
  if (refs.some((ref) => !ref) || !explicitRef) return null;

  const uniqueRefs = new Set([...refs, ...(databaseRef ? [databaseRef] : []), ...keyRefs, explicitRef]);
  if (uniqueRefs.size !== 1 || uniqueRefs.has(PRODUCTION_SUPABASE_PROJECT_REF)) return null;

  return {
    enabled: true,
    gitSha:
      env.VERCEL_GIT_COMMIT_SHA?.trim() ||
      env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.trim() ||
      env.GIT_SHA?.trim() ||
      null,
    supabaseProjectRef: explicitRef,
    paymentSandbox: env.PAYMENT_SANDBOX_MODE === "true",
    disposableMailbox: env.STAGING_ACCEPTANCE_MAILBOX_MODE === "disposable",
    partnerWritesDisabled: env.STAGING_ACCEPTANCE_PARTNER_WRITES === "false",
  };
}
