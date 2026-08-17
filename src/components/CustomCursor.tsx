"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

const INTERACTIVE_SELECTOR =
  'a[href], button:not(:disabled), [role="button"]:not([aria-disabled="true"]), input[type="submit"]:not(:disabled), input[type="button"]:not(:disabled)';

const TEXT_FIELD_SELECTOR =
  "input:not([type=button]):not([type=submit]):not([type=checkbox]):not([type=radio]), textarea, select, [contenteditable='true']";

const DOT_SCALE_IDLE = 1;
const DOT_SCALE_HOVER = 3.5;
/** Hit-test at most this often — elementFromPoint is expensive on every mousemove. */
const HIT_TEST_INTERVAL_MS = 80;
/** Stop the rAF loop shortly after the pointer stops moving. */
const IDLE_STOP_MS = 140;

function isFinePointerDevice() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: fine)").matches;
}

function prefersReducedMotion() {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function prefersReducedTransparency() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-transparency: reduce)").matches;
}

function prefersHighContrast() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-contrast: more)").matches;
}

function isOverInteractive(x: number, y: number): boolean {
  const hit = document.elementFromPoint(x, y);
  if (!hit) return false;
  if (hit.closest("[data-no-custom-cursor]")) return false;
  if (hit.closest(TEXT_FIELD_SELECTOR)) return false;

  const target = hit.closest(INTERACTIVE_SELECTOR) as HTMLElement | null;
  if (!target) return false;
  return !target.matches(":disabled, [aria-disabled='true']");
}

/**
 * Decorative desktop cursor. Idle-stopped rAF + throttled hit-testing so the
 * main thread is not taxed when the pointer is still.
 */
export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: -100, y: -100 });
  const ringRefPos = useRef({ x: -100, y: -100 });
  const dotScaleRef = useRef(DOT_SCALE_IDLE);
  const overInteractiveRef = useRef(false);
  const overTextFieldRef = useRef(false);
  const visibleRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const idleTimerRef = useRef<number | null>(null);
  const lastHitTestAtRef = useRef(0);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (
      !isFinePointerDevice() ||
      prefersReducedMotion() ||
      prefersReducedTransparency() ||
      prefersHighContrast()
    ) {
      return;
    }

    setEnabled(true);

    const lerp = (current: number, target: number, amount: number) =>
      current + (target - current) * amount;

    const applyVisibility = () => {
      const hide = !visibleRef.current || overTextFieldRef.current;
      const opacity = hide ? "0" : "1";
      if (dotRef.current) dotRef.current.style.opacity = opacity;
      if (ringRef.current) ringRef.current.style.opacity = opacity;
    };

    const stopLoop = () => {
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };

    const animate = () => {
      const dot = dotRef.current;
      const ring = ringRef.current;
      const mouse = mouseRef.current;
      const ringPos = ringRefPos.current;
      const overInteractive = overInteractiveRef.current;

      const followStrength = overInteractive ? 0.32 : 0.14;
      ringPos.x = lerp(ringPos.x, mouse.x, followStrength);
      ringPos.y = lerp(ringPos.y, mouse.y, followStrength);

      dotScaleRef.current = lerp(
        dotScaleRef.current,
        overInteractive ? DOT_SCALE_HOVER : DOT_SCALE_IDLE,
        0.22,
      );

      if (dot) {
        dot.style.transform = `translate3d(${mouse.x}px, ${mouse.y}px, 0) translate(-50%, -50%) scale(${dotScaleRef.current})`;
      }

      if (ring) {
        ring.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0) translate(-50%, -50%)`;
      }

      rafRef.current = window.requestAnimationFrame(animate);
    };

    const ensureLoop = () => {
      if (rafRef.current == null) {
        rafRef.current = window.requestAnimationFrame(animate);
      }
      if (idleTimerRef.current != null) window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = window.setTimeout(stopLoop, IDLE_STOP_MS);
    };

    function handleMove(event: MouseEvent) {
      mouseRef.current = { x: event.clientX, y: event.clientY };
      visibleRef.current = true;

      const now = performance.now();
      if (now - lastHitTestAtRef.current >= HIT_TEST_INTERVAL_MS) {
        lastHitTestAtRef.current = now;
        const hit = document.elementFromPoint(event.clientX, event.clientY);
        overTextFieldRef.current = Boolean(hit?.closest(TEXT_FIELD_SELECTOR));
        overInteractiveRef.current = isOverInteractive(event.clientX, event.clientY);
        applyVisibility();
      }

      ensureLoop();
    }

    function handleLeave() {
      visibleRef.current = false;
      overInteractiveRef.current = false;
      applyVisibility();
      stopLoop();
    }

    window.addEventListener("mousemove", handleMove, { passive: true });
    window.addEventListener("mouseleave", handleLeave);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseleave", handleLeave);
      if (idleTimerRef.current != null) window.clearTimeout(idleTimerRef.current);
      stopLoop();
    };
  }, []);

  if (!enabled) return null;

  return (
    <>
      <div
        ref={dotRef}
        aria-hidden
        className={cn(
          "pointer-events-none fixed left-0 top-0 z-[var(--token-z-cursor,87)] h-1 w-1 rounded-full bg-sky opacity-0 will-change-transform",
        )}
      />
      <div
        ref={ringRef}
        aria-hidden
        className={cn(
          "pointer-events-none fixed left-0 top-0 z-[var(--token-z-cursor-ring,86)] h-5 w-5 rounded-full border border-sky/70 opacity-0 will-change-transform",
        )}
      />
    </>
  );
}
