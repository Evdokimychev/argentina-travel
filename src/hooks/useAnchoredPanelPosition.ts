"use client";

import { useLayoutEffect, useState, type RefObject } from "react";

const VIEWPORT_PADDING_PX = 16;
const TRIGGER_GAP_PX = 12;

export type AnchoredPanelCoords = {
  top: number;
  left: number;
};

export function useAnchoredPanelPosition(
  open: boolean,
  triggerRef: RefObject<HTMLElement | null>,
  panelRef: RefObject<HTMLElement | null>
): AnchoredPanelCoords | null {
  const [coords, setCoords] = useState<AnchoredPanelCoords | null>(null);

  useLayoutEffect(() => {
    if (!open) {
      setCoords(null);
      return;
    }

    function update() {
      const trigger = triggerRef.current;
      const panel = panelRef.current;
      if (!trigger || !panel) return;

      const triggerRect = trigger.getBoundingClientRect();
      const panelWidth = panel.offsetWidth || panel.getBoundingClientRect().width;
      const viewportWidth = window.innerWidth;

      let left = triggerRect.left + triggerRect.width / 2 - panelWidth / 2;
      left = Math.max(
        VIEWPORT_PADDING_PX,
        Math.min(left, viewportWidth - panelWidth - VIEWPORT_PADDING_PX)
      );

      setCoords({
        top: triggerRect.bottom + TRIGGER_GAP_PX,
        left,
      });
    }

    update();

    const panel = panelRef.current;
    const resizeObserver =
      panel && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(update)
        : null;
    if (panel) resizeObserver?.observe(panel);

    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, triggerRef, panelRef]);

  return coords;
}
