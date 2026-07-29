import "server-only";

import pg from "pg";
import { createPgClientConfig, resolveDatabaseUrl } from "@/lib/database-url";

/** Revoke all Supabase Auth refresh sessions for a user on the attested project. */
export async function revokeSupabaseAuthSessions(
  userId: string
): Promise<{ ok: boolean; revokedCount: number }> {
  const connectionString = resolveDatabaseUrl();
  if (!connectionString) {
    return { ok: false, revokedCount: 0 };
  }

  const client = new pg.Client(createPgClientConfig(connectionString));

  try {
    await client.connect();
    const { rowCount } = await client.query("delete from auth.sessions where user_id = $1", [
      userId,
    ]);
    return {
      ok: true,
      revokedCount: rowCount ?? 0,
    };
  } finally {
    await client.end().catch(() => undefined);
  }
}
