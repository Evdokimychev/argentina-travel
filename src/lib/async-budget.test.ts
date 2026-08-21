import { describe, expect, it, vi } from "vitest";
import { withBudget, withBudgetFallback } from "@/lib/async-budget";

describe("async budget", () => {
  it("resolves when work finishes inside the budget", async () => {
    await expect(withBudget("fast", 200, async () => "ok")).resolves.toBe("ok");
  });

  it("rejects when work exceeds the budget", async () => {
    await expect(
      withBudget(
        "slow",
        30,
        () => new Promise((resolve) => setTimeout(() => resolve("late"), 200)),
      ),
    ).rejects.toThrow(/budget_exceeded/);
  });

  it("returns fallback instead of hanging the caller", async () => {
    const warn = vi.spyOn(console, "error").mockImplementation(() => undefined);
    await expect(
      withBudgetFallback(
        "slow-fallback",
        30,
        () => new Promise((resolve) => setTimeout(() => resolve("late"), 200)),
        ["static"],
      ),
    ).resolves.toEqual(["static"]);
    warn.mockRestore();
  });
});
