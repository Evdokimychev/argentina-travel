"use client";

import { useCallback, useRef, useState } from "react";

const DISMISS_THRESHOLD_PX = 72;

type SwipeDismissOptions = {
  enabled?: boolean;
  onDismiss: () => void;
};

/** Vertical swipe-down on mobile to close bottom-sheet dialogs. */
export function useDialogSwipeDismiss({ enabled = true, onDismiss }: SwipeDismissOptions) {
  const startYRef = useRef<number | null>(null);
  const draggingRef = useRef(false);
  const [offsetY, setOffsetY] = useState(0);

  const reset = useCallback(() => {
    startYRef.current = null;
    draggingRef.current = false;
    setOffsetY(0);
  }, []);

  const onTouchStart = useCallback(
    (event: React.TouchEvent) => {
      if (!enabled) return;
      startYRef.current = event.touches[0]?.clientY ?? null;
      draggingRef.current = true;
    },
    [enabled],
  );

  const onTouchMove = useCallback(
    (event: React.TouchEvent) => {
      if (!enabled || !draggingRef.current || startYRef.current == null) return;
      const currentY = event.touches[0]?.clientY ?? startYRef.current;
      const delta = Math.max(0, currentY - startYRef.current);
      setOffsetY(delta);
    },
    [enabled],
  );

  const onTouchEnd = useCallback(() => {
    if (!enabled) return;
    if (offsetY >= DISMISS_THRESHOLD_PX) {
      onDismiss();
    }
    reset();
  }, [enabled, offsetY, onDismiss, reset]);

  const onTouchCancel = useCallback(() => {
    reset();
  }, [reset]);

  return {
    offsetY,
    swipeHandlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onTouchCancel,
    },
  };
}
