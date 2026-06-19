"use client";

import { useEffect } from "react";
import {
  COOKIE_CONSENT_EVENT,
  hasInteractionTrackingConsent,
} from "@/lib/personalization/interaction-consent";
import { queueInteraction } from "@/lib/personalization/interactions-client";
import type { InteractionAction, InteractionEntityType } from "@/types/user-interactions";

export function useInteractionTrackingConsent(): boolean {
  // E80: заменить на гранулярную проверку категорий согласия.
  if (typeof window === "undefined") return false;
  return hasInteractionTrackingConsent();
}

export function useTrackEntityView(
  entityType: InteractionEntityType,
  entityId: string | null | undefined
): void {
  useEffect(() => {
    if (!entityId || !hasInteractionTrackingConsent()) return;
    queueInteraction({ entityType, entityId, action: "view" });
  }, [entityType, entityId]);
}

export function useInteractionConsentListener(onConsent: () => void): void {
  useEffect(() => {
    if (hasInteractionTrackingConsent()) {
      onConsent();
    }
    const handler = () => onConsent();
    window.addEventListener(COOKIE_CONSENT_EVENT, handler);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, handler);
  }, [onConsent]);
}

export function trackEntityFavorite(
  entityType: InteractionEntityType,
  entityId: string,
  action: InteractionAction = "favorite"
): void {
  if (!hasInteractionTrackingConsent()) return;
  queueInteraction({ entityType, entityId, action });
}
