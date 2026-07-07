import "server-only";

import pg from "pg";

/** Revoke all Supabase Auth refresh sessions for a user (requires DATABASE_URL). */
export async function revokeSupabaseAuthSessions(
  userId: string
): Promise<{ ok: boolean; revokedCount: number }> {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    return { ok: false, revokedCount: 0 };
  }

  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

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
