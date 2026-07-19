import { describe, expect, it, vi } from "vitest";
import { AdminExportTooLargeError, collectAdminExportRows } from "@/lib/admin/export-pagination";

describe("admin export pagination", () => {
  it("collects every page with stable inclusive ranges", async () => {
    const fetchPage = vi
      .fn<(from: number, to: number) => Promise<number[]>>()
      .mockResolvedValueOnce([1, 2])
      .mockResolvedValueOnce([3, 4])
      .mockResolvedValueOnce([5]);

    await expect(collectAdminExportRows(fetchPage, { pageSize: 2, maxRows: 10 })).resolves.toEqual([
      1, 2, 3, 4, 5,
    ]);
    expect(fetchPage.mock.calls).toEqual([[0, 1], [2, 3], [4, 5]]);
  });

  it("fails instead of silently truncating an oversized export", async () => {
    const fetchPage = vi.fn().mockResolvedValue([1, 2]);
    await expect(
      collectAdminExportRows(fetchPage, { pageSize: 2, maxRows: 3 }),
    ).rejects.toBeInstanceOf(AdminExportTooLargeError);
  });
});
