"use client";

import { useEffect, useRef } from "react";

/**
 * Mobile browser back / gesture back closes an open dialog.
 * Pushes a history entry while open; popstate triggers close.
 *
 * Callback is stored in a ref so parent re-renders (e.g. typing in a form)
 * do not re-run cleanup → history.back() → accidental modal close.
 */
export function useDialogBackClose(
  open: boolean,
  onOpenChange: (open: boolean) => void,
  enabled = true,
): void {
  const pushedRef = useRef(false);
  const closingFromPopRef = useRef(false);
  const onOpenChangeRef = useRef(onOpenChange);

  useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  });

  useEffect(() => {
    if (!enabled || !open) return;

    pushedRef.current = true;
    closingFromPopRef.current = false;
    window.history.pushState({ __dialogBackClose: true }, "");

    const onPopState = () => {
      closingFromPopRef.current = true;
      onOpenChangeRef.current(false);
    };

    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
      if (pushedRef.current && !closingFromPopRef.current) {
        pushedRef.current = false;
        window.history.back();
      } else {
        pushedRef.current = false;
      }
    };
  }, [open, enabled]);
}
