const SUPABASE_PROJECT_REF_PATTERN = /^[a-z0-9]{20}$/;

export function supabaseProjectRefFromUrl(value: string): string | null {
  try {
    const hostname = new URL(value).hostname.toLowerCase();
    return hostname.match(/^([a-z0-9]{20})\.supabase\.(?:co|com)$/)?.[1] ?? null;
  } catch {
    return null;
  }
}

export function supabaseProjectRefFromDatabaseUrl(value: string): string | null {
  try {
    const parsed = new URL(value);
    const fromHost = parsed.hostname
      .toLowerCase()
      .match(/^(?:db\.)?([a-z0-9]{20})\.supabase\.(?:co|com)$/)?.[1];
    if (fromHost) return fromHost;

    const poolerHost = /(^|\.)pooler\.supabase\.com$/.test(
      parsed.hostname.toLowerCase(),
    );
    const fromUser = poolerHost
      ? decodeURIComponent(parsed.username)
          .toLowerCase()
          .match(/^postgres\.([a-z0-9]{20})$/)?.[1]
      : null;
    return fromUser && SUPABASE_PROJECT_REF_PATTERN.test(fromUser) ? fromUser : null;
  } catch {
    return null;
  }
}
