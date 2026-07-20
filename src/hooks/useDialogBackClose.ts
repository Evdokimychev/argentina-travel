"use client";

import { useEffect, useRef } from "react";

const DIALOG_BACK_STATE_KEY = "__dialogBackClose";

/**
 * Removes the synthetic dialog history entry before an internal navigation.
 * Otherwise the dialog cleanup can call history.back() after router.push() and
 * silently return the user to the page underneath the modal.
 */
export function navigateAfterDialogClose(navigate: () => void, close: () => void): void {
  if (
    typeof window === "undefined" ||
    !window.matchMedia("(max-width: 767px)").matches ||
    !window.history.state?.[DIALOG_BACK_STATE_KEY]
  ) {
    close();
    navigate();
    return;
  }

  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    window.clearTimeout(fallbackTimer);
    window.setTimeout(() => {
      close();
      navigate();
    }, 0);
  };
  const onPopState = () => finish();

  window.addEventListener("popstate", onPopState, { once: true });
  window.history.back();

  const fallbackTimer = window.setTimeout(() => {
    if (finished) return;
    window.removeEventListener("popstate", onPopState);
    const state = { ...(window.history.state ?? {}) };
    delete state[DIALOG_BACK_STATE_KEY];
    window.history.replaceState(state, "");
    finish();
  }, 500);
}

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
    // The synthetic entry exists for mobile gesture/back navigation only.
    // On desktop it added duplicate history entries and could race internal links.
    if (!window.matchMedia("(max-width: 767px)").matches) return;

    const entryId = `dialog-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    pushedRef.current = true;
    closingFromPopRef.current = false;
    window.history.pushState(
      { ...(window.history.state ?? {}), [DIALOG_BACK_STATE_KEY]: entryId },
      "",
    );

    const onPopState = () => {
      closingFromPopRef.current = true;
      onOpenChangeRef.current(false);
    };

    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
      if (pushedRef.current && !closingFromPopRef.current) {
        pushedRef.current = false;
        window.setTimeout(() => {
          if (window.history.state?.[DIALOG_BACK_STATE_KEY] === entryId) {
            window.history.back();
          }
        }, 0);
      } else {
        pushedRef.current = false;
      }
    };
  }, [open, enabled]);
}
