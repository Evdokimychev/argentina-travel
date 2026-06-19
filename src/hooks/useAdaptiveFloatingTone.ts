"use client";

import { useCallback, useLayoutEffect, useState, type RefObject } from "react";
import {
  sampleElementBackgroundTone,
  type BackgroundTone,
} from "@/lib/background-tone-at-point";

export function useAdaptiveFloatingTone(
  ref: RefObject<HTMLElement | null>,
  active = true
): BackgroundTone {
  const [tone, setTone] = useState<BackgroundTone>("light");

  const update = useCallback(() => {
    const element = ref.current;
    if (!element || !active) return;
    setTone(sampleElementBackgroundTone(element));
  }, [active, ref]);

  useLayoutEffect(() => {
    if (!active) return;

    update();

    let raf = 0;
    const scheduleUpdate = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        update();
      });
    };

    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [active, update]);

  return tone;
}
