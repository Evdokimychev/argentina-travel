"use client";

import { useCallback, useEffect, useRef } from "react";

const CLOSE_DELAY_MS = 350;

export function useMegaMenuHoverIntent(
  open: boolean,
  onOpenChange: (open: boolean) => void,
) {
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerRef = useRef({ x: 0, y: 0 });

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const isPointerOverMenu = useCallback(() => {
    const { x, y } = pointerRef.current;
    const target = document.elementFromPoint(x, y);
    const root = rootRef.current;
    const panel = panelRef.current;
    return Boolean(target && (root?.contains(target) || panel?.contains(target)));
  }, []);

  const openMenu = useCallback(() => {
    clearCloseTimer();
    onOpenChange(true);
  }, [clearCloseTimer, onOpenChange]);

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null;
      if (!isPointerOverMenu()) {
        onOpenChange(false);
      }
    }, CLOSE_DELAY_MS);
  }, [clearCloseTimer, isPointerOverMenu, onOpenChange]);

  const closeMenu = useCallback(() => {
    clearCloseTimer();
    onOpenChange(false);
  }, [clearCloseTimer, onOpenChange]);

  const rememberPointer = useCallback((clientX: number, clientY: number) => {
    pointerRef.current = { x: clientX, y: clientY };
  }, []);

  useEffect(() => () => clearCloseTimer(), [clearCloseTimer]);

  useEffect(() => {
    if (!open) return;

    const onPointerMove = (event: PointerEvent) => {
      pointerRef.current = { x: event.clientX, y: event.clientY };
    };

    document.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => document.removeEventListener("pointermove", onPointerMove);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      const root = rootRef.current;
      const panel = panelRef.current;
      if (root?.contains(target) || panel?.contains(target)) return;
      closeMenu();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, closeMenu]);

  return {
    rootRef,
    panelRef,
    openMenu,
    scheduleClose,
    closeMenu,
    rememberPointer,
  };
}
