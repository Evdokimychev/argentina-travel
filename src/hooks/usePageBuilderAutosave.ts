"use client";

import { useEffect, useRef } from "react";

type AutosavePayload = Record<string, unknown>;

/**
 * Debounced autosave for page builder / CMS editors.
 * Calls `onSave` after `delayMs` of inactivity; skips identical payloads.
 */
export function usePageBuilderAutosave(
  payload: AutosavePayload,
  onSave: () => void | Promise<void>,
  options?: { delayMs?: number; enabled?: boolean }
): { saving: boolean; lastSavedAt: Date | null } {
  const delayMs = options?.delayMs ?? 3000;
  const enabled = options?.enabled ?? true;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPayloadRef = useRef<string>("");
  const savingRef = useRef(false);
  const lastSavedRef = useRef<Date | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const serialized = JSON.stringify(payload);
    if (serialized === lastPayloadRef.current) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      void (async () => {
        savingRef.current = true;
        try {
          await onSave();
          lastPayloadRef.current = serialized;
          lastSavedRef.current = new Date();
        } finally {
          savingRef.current = false;
        }
      })();
    }, delayMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [payload, onSave, delayMs, enabled]);

  return {
    saving: savingRef.current,
    lastSavedAt: lastSavedRef.current,
  };
}
