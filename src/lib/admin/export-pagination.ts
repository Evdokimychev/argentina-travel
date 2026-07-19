export const ADMIN_EXPORT_PAGE_SIZE = 1_000;
export const ADMIN_EXPORT_MAX_ROWS = 100_000;

export class AdminExportTooLargeError extends Error {
  constructor() {
    super("ADMIN_EXPORT_TOO_LARGE");
    this.name = "AdminExportTooLargeError";
  }
}
/** Collects every page and fails explicitly instead of returning a silently truncated export. */
export async function collectAdminExportRows<T>(
  fetchPage: (from: number, to: number) => Promise<T[]>,
  options?: { pageSize?: number; maxRows?: number },
): Promise<T[]> {
  const pageSize = options?.pageSize ?? ADMIN_EXPORT_PAGE_SIZE;
  const maxRows = options?.maxRows ?? ADMIN_EXPORT_MAX_ROWS;
  if (!Number.isInteger(pageSize) || pageSize < 1 || !Number.isInteger(maxRows) || maxRows < 1) {
    throw new Error("ADMIN_EXPORT_INVALID_LIMITS");
  }

  const rows: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const page = await fetchPage(from, from + pageSize - 1);
    if (rows.length + page.length > maxRows) throw new AdminExportTooLargeError();
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}
