const PROJECT_REF_RE = /^[a-z0-9]{20}$/;
const POSTGRES_PROTOCOLS = new Set(["postgres:", "postgresql:"]);
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function projectRef(value, label) {
  const normalized = value?.trim().toLowerCase();
  if (!normalized || !PROJECT_REF_RE.test(normalized)) {
    throw new Error(`${label} must be a 20-character Supabase project ref`);
  }
  return normalized;
}

function parseUrl(value, label) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${label} must be a valid PostgreSQL URL`);
  }
  if (!POSTGRES_PROTOCOLS.has(parsed.protocol)) {
    throw new Error(`${label} must use postgres:// or postgresql://`);
  }
  if (!parsed.hostname || !parsed.pathname || parsed.pathname === "/") {
    throw new Error(`${label} is missing host or database name`);
  }
  return parsed;
}

export function supabaseProjectRefFromUrl(value) {
  if (!value) return null;
  try {
    const hostname = new URL(value).hostname.toLowerCase();
    return hostname.match(/^([a-z0-9]{20})\.supabase\.co$/)?.[1] ?? null;
  } catch {
    return null;
  }
}

export function parseSupabaseDatabaseTarget(value) {
  let parsed;
  try {
    parsed = parseUrl(value, "Database connection");
  } catch {
    return {
      mode: "invalid",
      port: null,
      projectRef: null,
      targetStatus: "unverified",
      local: false,
    };
  }

  const hostname = parsed.hostname.toLowerCase();
  const port = Number(parsed.port || 5432);
  const local = LOCAL_HOSTS.has(hostname);
  if (local) {
    return {
      mode: "local",
      port,
      projectRef: null,
      targetStatus: "unverified",
      local: true,
    };
  }

  const directRef = hostname.match(/^db\.([a-z0-9]{20})\.supabase\.co$/)?.[1] ?? null;
  if (directRef && (port === 5432 || port === 6543)) {
    return {
      mode: port === 6543 ? "supabase_transaction" : "supabase_direct",
      port,
      projectRef: directRef,
      targetStatus: "unverified",
      local: false,
    };
  }

  const poolerHost = /(^|\.)pooler\.supabase\.com$/.test(hostname);
  const poolerRef = decodeURIComponent(parsed.username || "")
    .match(/^postgres\.([a-z0-9]{20})$/)?.[1] ?? null;
  if (poolerHost && poolerRef && (port === 5432 || port === 6543)) {
    return {
      mode: port === 6543 ? "supabase_transaction" : "supabase_session",
      port,
      projectRef: poolerRef,
      targetStatus: "unverified",
      local: false,
    };
  }

  return {
    mode: "other",
    port: Number.isFinite(port) ? port : null,
    projectRef: null,
    targetStatus: "unverified",
    local: false,
  };
}

export function resolveTrustedSupabaseProjectRef(
  env = process.env,
  {
    projectRefEnvNames = ["SUPABASE_PROJECT_REF", "EXPECTED_SUPABASE_PROJECT_REF"],
    urlEnvNames = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL"],
    required = true,
  } = {},
) {
  const refs = [];
  for (const name of projectRefEnvNames) {
    const value = env[name]?.trim();
    if (value) refs.push({ name, value: projectRef(value, name) });
  }
  for (const name of urlEnvNames) {
    const value = env[name]?.trim();
    if (!value) continue;
    const ref = supabaseProjectRefFromUrl(value);
    if (!ref) throw new Error(`${name} does not contain a valid Supabase project ref`);
    refs.push({ name, value: ref });
  }

  const unique = new Set(refs.map((entry) => entry.value));
  if (unique.size > 1) {
    throw new Error(`Trusted Supabase project refs disagree across ${refs.map((entry) => entry.name).join(", ")}`);
  }
  const resolved = unique.values().next().value ?? null;
  if (!resolved && required) {
    throw new Error("A trusted Supabase project ref is required before using PostgreSQL tooling");
  }
  return resolved;
}

export function assertDatabaseTarget({
  connectionString,
  expectedProjectRef,
  purpose = "database operation",
  allowLocal = false,
}) {
  const parsed = parseUrl(connectionString, "Database connection");
  const diagnostics = parseSupabaseDatabaseTarget(connectionString);

  if (diagnostics.local) {
    if (!allowLocal) throw new Error(`Database target for ${purpose} is not an attested Supabase project`);
    return {
      connectionString: parsed.toString(),
      diagnostics: { ...diagnostics, targetStatus: "verified" },
    };
  }

  const expected = projectRef(expectedProjectRef, "Expected database project ref");
  if (!diagnostics.projectRef) {
    throw new Error(`Database target for ${purpose} is unverified`);
  }
  if (diagnostics.projectRef !== expected) {
    throw new Error(`Database target for ${purpose} does not match the trusted project ref`);
  }

  return {
    connectionString: parsed.toString(),
    diagnostics: { ...diagnostics, targetStatus: "verified" },
  };
}

export function resolveAttestedDatabaseUrl(
  env = process.env,
  {
    expectedProjectRef,
    candidates = ["DATABASE_URL", "POSTGRES_URL_NON_POOLING", "POSTGRES_URL", "POSTGRES_PRISMA_URL"],
    purpose = "database operation",
    allowLocal = false,
    preferSessionPooler = true,
  } = {},
) {
  const rejected = [];
  for (const source of candidates) {
    const value = env[source]?.trim();
    if (!value) continue;
    try {
      const attested = assertDatabaseTarget({
        connectionString: value,
        expectedProjectRef,
        purpose,
        allowLocal,
      });
      const parsed = new URL(attested.connectionString);
      if (
        preferSessionPooler &&
        attested.diagnostics.mode === "supabase_transaction" &&
        /(^|\.)pooler\.supabase\.com$/.test(parsed.hostname.toLowerCase())
      ) {
        parsed.port = "5432";
        attested.connectionString = parsed.toString();
        attested.diagnostics = {
          ...attested.diagnostics,
          mode: "supabase_session",
          port: 5432,
        };
      }
      return { ...attested, source };
    } catch (error) {
      rejected.push({
        source,
        reason: error instanceof Error && /does not match/.test(error.message) ? "mismatch" : "unverified",
      });
    }
  }

  if (rejected.length > 0) {
    throw new Error(
      `No attested PostgreSQL target is available for ${purpose}; rejected sources: ${rejected
        .map((entry) => `${entry.source}:${entry.reason}`)
        .join(", ")}`,
    );
  }
  return null;
}

export function assertDistinctDatabaseTargets({
  sourceConnectionString,
  sourceProjectRef,
  targetConnectionString,
  targetProjectRef,
  purpose = "database copy",
  allowProductionTarget = false,
  productionProjectRef = null,
}) {
  const source = assertDatabaseTarget({
    connectionString: sourceConnectionString,
    expectedProjectRef: sourceProjectRef,
    purpose: `${purpose} source`,
  });
  const target = assertDatabaseTarget({
    connectionString: targetConnectionString,
    expectedProjectRef: targetProjectRef,
    purpose: `${purpose} target`,
  });
  if (source.diagnostics.projectRef === target.diagnostics.projectRef) {
    throw new Error(`Source and target must be distinct for ${purpose}`);
  }
  if (
    productionProjectRef &&
    target.diagnostics.projectRef === projectRef(productionProjectRef, "Production project ref") &&
    !allowProductionTarget
  ) {
    throw new Error(`Production target requires an explicit confirmation for ${purpose}`);
  }
  return { source, target };
}
