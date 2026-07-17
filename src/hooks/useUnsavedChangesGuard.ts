"use client";

import { useCallback, useEffect, useRef } from "react";

const DEFAULT_MESSAGE = "Есть несохранённые изменения. Покинуть страницу и потерять их?";

function isGuardedAnchorClick(event: MouseEvent): boolean {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return false;
  }

  const target = event.target;
  if (!(target instanceof Element)) return false;
  const anchor = target.closest("a[href]");
  if (!(anchor instanceof HTMLAnchorElement)) return false;
  if (anchor.target === "_blank" || anchor.hasAttribute("download")) return false;

  const destination = new URL(anchor.href, window.location.href);
  if (destination.origin !== window.location.origin) return false;

  return destination.href !== window.location.href;
}

export function useUnsavedChangesGuard(
  hasUnsavedChanges: boolean,
  message = DEFAULT_MESSAGE,
): { confirmNavigation: () => boolean } {
  const dirtyRef = useRef(hasUnsavedChanges);
  dirtyRef.current = hasUnsavedChanges;

  const confirmNavigation = useCallback(
    () => !dirtyRef.current || window.confirm(message),
    [message],
  );

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const handleDocumentClick = (event: MouseEvent) => {
      if (!dirtyRef.current || !isGuardedAnchorClick(event) || window.confirm(message)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    const handlePopState = () => {
      if (!dirtyRef.current || window.confirm(message)) return;
      window.history.forward();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);
    document.addEventListener("click", handleDocumentClick, true);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, [hasUnsavedChanges, message]);

  return { confirmNavigation };
}
