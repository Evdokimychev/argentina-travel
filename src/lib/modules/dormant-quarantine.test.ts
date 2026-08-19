import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/site-settings-server", () => ({
  fetchSiteModuleControlSnapshot: vi.fn(),
}));

vi.mock("@/lib/public-module-visibility", () => ({
  isPublicPathEnabled: vi.fn(),
  isTravelModulePathEnabled: vi.fn(),
}));

import { fetchSiteModuleControlSnapshot } from "@/lib/site-settings-server";
import { isPublicPathEnabled, isTravelModulePathEnabled } from "@/lib/public-module-visibility";
import { rejectIfPublicModuleQuarantined } from "@/lib/modules/dormant-quarantine";

describe("dormant quarantine", () => {
  beforeEach(() => {
    vi.mocked(fetchSiteModuleControlSnapshot).mockResolvedValue({
      ok: true,
      navigation: {} as never,
      modules: {} as never,
    });
  });

  it("returns 404 MODULE_QUARANTINED when control plane is unavailable", async () => {
    vi.mocked(fetchSiteModuleControlSnapshot).mockResolvedValue({ ok: false });
    const res = await rejectIfPublicModuleQuarantined("/forum", { labelRu: "Форум" });
    expect(res?.status).toBe(404);
    const body = await res!.json();
    expect(body.code).toBe("MODULE_QUARANTINED");
  });

  it("returns 404 MODULE_QUARANTINED when public path disabled (launch clamp)", async () => {
    vi.mocked(isPublicPathEnabled).mockReturnValue(false);
    vi.mocked(isTravelModulePathEnabled).mockReturnValue(true);
    const res = await rejectIfPublicModuleQuarantined("/forum", { labelRu: "Форум" });
    expect(res?.status).toBe(404);
    const body = await res!.json();
    expect(body.code).toBe("MODULE_QUARANTINED");
  });

  it("returns null when module is publicly enabled on control plane", async () => {
    vi.mocked(isPublicPathEnabled).mockReturnValue(true);
    vi.mocked(isTravelModulePathEnabled).mockReturnValue(true);
    const res = await rejectIfPublicModuleQuarantined("/shop", { labelRu: "Магазин" });
    expect(res).toBeNull();
  });
});
