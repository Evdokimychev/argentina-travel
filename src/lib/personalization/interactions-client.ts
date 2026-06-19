"use client";

import {
  COOKIE_CONSENT_EVENT,
  hasInteractionTrackingConsent,
} from "@/lib/personalization/interaction-consent";
import {
  getOrCreateAnonymousId,
  persistAnonymousIdCookie,
} from "@/lib/personalization/anonymous-id";
import type {
  InteractionAction,
  InteractionBatchItem,
  InteractionEntityType,
  SessionInteraction,
} from "@/types/user-interactions";

const SESSION_KEY = "pa-interactions-buffer";
const FLUSH_INTERVAL_MS = 15_000;
const MAX_BUFFER = 40;

let flushTimer: ReturnType<typeof setTimeout> | null = null;
let flushInFlight = false;

function readBuffer(): SessionInteraction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SessionInteraction[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeBuffer(items: SessionInteraction[]): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(items.slice(-MAX_BUFFER)));
  } catch {
    /* ignore quota errors */
  }
}

function dedupeKey(item: InteractionBatchItem): string {
  return `${item.entityType}:${item.entityId}:${item.action}`;
}

export function getSessionInteractions(): SessionInteraction[] {
  return readBuffer();
}

export function queueInteraction(input: {
  entityType: InteractionEntityType;
  entityId: string;
  action: InteractionAction;
}): void {
  if (!hasInteractionTrackingConsent()) return;

  const item: SessionInteraction = {
    entityType: input.entityType,
    entityId: input.entityId,
    action: input.action,
    ts: new Date().toISOString(),
  };

  const buffer = readBuffer();
  const withoutDup = buffer.filter((row) => dedupeKey(row) !== dedupeKey(item));
  writeBuffer([item, ...withoutDup]);

  scheduleFlush();
}

async function flushInteractions(): Promise<void> {
  if (flushInFlight || !hasInteractionTrackingConsent()) return;

  const buffer = readBuffer();
  if (!buffer.length) return;

  flushInFlight = true;
  const anonymousId = getOrCreateAnonymousId();

  try {
    const response = await fetch("/api/interactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        anonymousId,
        interactions: buffer,
      }),
      keepalive: true,
    });

    if (!response.ok) return;

    persistAnonymousIdCookie(anonymousId);
    writeBuffer([]);
  } catch {
    /* retry on next flush */
  } finally {
    flushInFlight = false;
  }
}

function scheduleFlush(): void {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushInteractions();
  }, FLUSH_INTERVAL_MS);
}

export function flushInteractionsNow(): void {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  void flushInteractions();
}

export function bindInteractionTrackingLifecycle(): () => void {
  if (typeof window === "undefined") return () => undefined;

  const onConsent = () => {
    scheduleFlush();
  };

  const onVisibility = () => {
    if (document.visibilityState === "hidden") {
      flushInteractionsNow();
    }
  };

  window.addEventListener(COOKIE_CONSENT_EVENT, onConsent);
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("pagehide", flushInteractionsNow);

  return () => {
    window.removeEventListener(COOKIE_CONSENT_EVENT, onConsent);
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("pagehide", flushInteractionsNow);
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
  };
}
