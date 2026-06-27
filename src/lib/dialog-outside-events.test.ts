import { describe, expect, it, vi } from "vitest";
import {
  composeDialogOutsideHandler,
  shouldPreventDialogOutsideDismiss,
} from "./dialog-outside-events";

function outsideEvent(target: unknown): CustomEvent<{ originalEvent: Event }> {
  return {
    target,
    preventDefault: vi.fn(),
  } as unknown as CustomEvent<{ originalEvent: Event }>;
}

describe("dialog outside dismiss guards", () => {
  it("blocks dismiss for portaled popover content", () => {
    const inner = {
      closest: (selector: string) =>
        selector === "[data-radix-popper-content-wrapper]" ? {} : null,
    };

    expect(shouldPreventDialogOutsideDismiss(outsideEvent(inner))).toBe(true);
  });

  it("allows dismiss for overlay clicks", () => {
    const overlay = {
      closest: () => null,
    };

    expect(shouldPreventDialogOutsideDismiss(outsideEvent(overlay))).toBe(false);
  });

  it("invokes user handler when dismiss is allowed", () => {
    const handler = vi.fn();
    const event = outsideEvent({ closest: () => null });

    composeDialogOutsideHandler(handler, event);

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(handler).toHaveBeenCalledWith(event);
  });
});
