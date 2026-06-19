"use client";

import { useEffect, useRef, useState } from "react";

function randomIntervalMs(minMs: number, maxMs: number): number {
  return minMs + Math.floor(Math.random() * (maxMs - minMs + 1));
}

/** Периодически увеличивает ключ, чтобы перезапустить CSS-пульс (интервал случайный). */
export function useRandomAttentionPulse({
  minMs = 10_000,
  maxMs = 60_000,
  enabled = true,
}: {
  minMs?: number;
  maxMs?: number;
  enabled?: boolean;
} = {}) {
  const [pulseKey, setPulseKey] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const scheduleNext = () => {
      timeoutRef.current = setTimeout(() => {
        if (document.visibilityState === "visible") {
          setPulseKey((key) => key + 1);
        }
        scheduleNext();
      }, randomIntervalMs(minMs, maxMs));
    };

    scheduleNext();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [enabled, minMs, maxMs]);

  return pulseKey;
}
