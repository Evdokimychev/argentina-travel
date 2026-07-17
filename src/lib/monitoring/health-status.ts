export type PublicDatabaseHealthInput = {
  database: {
    ok: boolean;
    skipped: boolean;
  };
  postgresDirect: {
    ok: boolean;
  };
};

/**
 * Public health is green only after both application database paths were
 * actually checked and succeeded. A skipped or unavailable database must not
 * make a production deployment look healthy.
 */
export function resolvePublicDatabaseHealth(input: PublicDatabaseHealthInput): boolean {
  return !input.database.skipped && input.database.ok && input.postgresDirect.ok;
}
