import { describe, expect, it, vi } from "vitest";
import { assertOrganizerTourOwnership } from "./tour-ownership";

function adminClient(row: { id: string; owner_user_id: string } | null) {
  return {
    from() {
      return {
        select() {
          return {
            eq() {
              return {
                async maybeSingle() {
                  return { data: row, error: null };
                },
              };
            },
          };
        },
      };
    },
  };
}

describe("organizer tour ownership (IDOR guard)", () => {
  it("allows the owning organizer", async () => {
    const result = await assertOrganizerTourOwnership(
      adminClient({ id: "tour-1", owner_user_id: "org-1" }) as never,
      "tour-1",
      "org-1",
    );
    expect(result.ok).toBe(true);
  });

  it("rejects a foreign organizer with 403 (negative capability)", async () => {
    const result = await assertOrganizerTourOwnership(
      adminClient({ id: "tour-1", owner_user_id: "org-owner" }) as never,
      "tour-1",
      "org-attacker",
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(403);
      await expect(result.response.json()).resolves.toEqual({ error: "Доступ запрещён" });
    }
  });

  it("returns 404 when the tour is missing", async () => {
    const result = await assertOrganizerTourOwnership(
      adminClient(null) as never,
      "missing",
      "org-1",
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(404);
    }
  });

  it("does not call unrelated tables while checking ownership", async () => {
    const from = vi.fn(() => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: { id: "tour-1", owner_user_id: "org-1" },
            error: null,
          }),
        }),
      }),
    }));
    await assertOrganizerTourOwnership({ from } as never, "tour-1", "org-1");
    expect(from).toHaveBeenCalledWith("tours");
    expect(from).toHaveBeenCalledTimes(1);
  });
});
