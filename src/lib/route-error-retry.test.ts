import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  reloadRoutePage,
  retryRouteErrorHard,
  retryRoutePage,
} from "@/lib/route-error-retry";

describe("route-error-retry", () => {
  const reload = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("window", { location: { reload: reload } });
    reload.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reloadRoutePage calls window.location.reload", () => {
    reloadRoutePage();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("retryRoutePage resets boundary and refreshes router", () => {
    const reset = vi.fn();
    const refresh = vi.fn();

    retryRoutePage(reset, { refresh });

    expect(reset).toHaveBeenCalledTimes(1);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(reload).not.toHaveBeenCalled();
  });

  it("retryRouteErrorHard resets boundary and reloads page", () => {
    const reset = vi.fn();

    retryRouteErrorHard(reset);

    expect(reset).toHaveBeenCalledTimes(1);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("retryRouteErrorHard still reloads if reset throws", () => {
    const reset = vi.fn(() => {
      throw new Error("broken boundary");
    });

    retryRouteErrorHard(reset);

    expect(reset).toHaveBeenCalledTimes(1);
    expect(reload).toHaveBeenCalledTimes(1);
  });
});
