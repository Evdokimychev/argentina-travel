/**
 * Shared Postgres URL resolver for Node scripts (mirrors src/lib/database-url.ts).
 */
export function resolveDatabaseUrl() {
  const candidates = [
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL_NON_POOLING,
    process.env.POSTGRES_URL,
    process.env.POSTGRES_PRISMA_URL,
  ];

  for (const value of candidates) {
    const trimmed = value?.trim();
    if (trimmed) return preferPgSessionPoolerUrl(trimmed);
  }

  return null;
}

function preferPgSessionPoolerUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.port === "6543" && parsed.hostname.includes("pooler.supabase.com")) {
      parsed.port = "5432";
      return parsed.toString();
    }
  } catch {
    // keep original
  }
  return url;
}
