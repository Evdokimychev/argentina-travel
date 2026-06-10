"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

const INTERACTIVE_SELECTOR =
  'a[href], button:not(:disabled), [role="button"]:not([aria-disabled="true"]), input[type="submit"]:not(:disabled), input[type="button"]:not(:disabled)';

const TEXT_FIELD_SELECTOR =
  "input:not([type=button]):not([type=submit]):not([type=checkbox]):not([type=radio]), textarea, select, [contenteditable='true']";

const DOT_SCALE_IDLE = 1;
const DOT_SCALE_HOVER = 3.5;

function isFinePointerDevice() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: fine)").matches;
}

function prefersReducedMotion() {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: -100, y: -100 });
  const ringRefPos = useRef({ x: -100, y: -100 });
  const dotScaleRef = useRef(DOT_SCALE_IDLE);
  const overInteractiveRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [overTextField, setOverTextField] = useState(false);

  useEffect(() => {
    if (!isFinePointerDevice() || prefersReducedMotion()) return;

    setEnabled(true);
    document.documentElement.classList.add("custom-cursor-active");

    const lerp = (current: number, target: number, amount: number) =>
      current + (target - current) * amount;

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
        0.22
      );

      if (dot) {
        dot.style.transform = `translate3d(${mouse.x}px, ${mouse.y}px, 0) translate(-50%, -50%) scale(${dotScaleRef.current})`;
      }

      if (ring) {
        ring.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0) translate(-50%, -50%)`;
      }

      rafRef.current = window.requestAnimationFrame(animate);
    };

    rafRef.current = window.requestAnimationFrame(animate);

    function handleMove(event: MouseEvent) {
      mouseRef.current = { x: event.clientX, y: event.clientY };
      setVisible(true);

      const hit = document.elementFromPoint(event.clientX, event.clientY);
      setOverTextField(Boolean(hit?.closest(TEXT_FIELD_SELECTOR)));
      overInteractiveRef.current = isOverInteractive(event.clientX, event.clientY);
    }

    function handleLeave() {
      setVisible(false);
      overInteractiveRef.current = false;
    }

    window.addEventListener("mousemove", handleMove, { passive: true });
    window.addEventListener("mouseleave", handleLeave);

    return () => {
      document.documentElement.classList.remove("custom-cursor-active");
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseleave", handleLeave);
      if (rafRef.current != null) window.cancelAnimationFrame(rafRef.current);
    };
  }, []);

  if (!enabled) return null;

  return (
    <>
      <div
        ref={dotRef}
        aria-hidden
        className={cn(
          "pointer-events-none fixed left-0 top-0 z-[9999] h-1 w-1 rounded-full bg-sky will-change-transform",
          (!visible || overTextField) && "opacity-0"
        )}
      />
      <div
        ref={ringRef}
        aria-hidden
        className={cn(
          "pointer-events-none fixed left-0 top-0 z-[9998] h-5 w-5 rounded-full border border-sky/70 will-change-transform",
          (!visible || overTextField) && "opacity-0"
        )}
      />
    </>
  );
}
