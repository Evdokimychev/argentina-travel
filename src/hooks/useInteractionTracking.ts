"use client";

import { useEffect } from "react";
import {
  COOKIE_CONSENT_CHANGED_EVENT,
  hasAnalyticsConsent,
} from "@/lib/cookie-consent";
import { hasInteractionTrackingConsent } from "@/lib/personalization/interaction-consent";
import { trackExcursionView, trackTourView } from "@/lib/analytics/gtm-events";
import { queueInteraction } from "@/lib/personalization/interactions-client";
import type { InteractionAction, InteractionEntityType } from "@/types/user-interactions";

export type EntityViewTrackingOptions = {
  title?: string;
  priceUsd?: number;
  partner?: string;
  cityName?: string;
  organizerId?: string;
};

export function useInteractionTrackingConsent(): boolean {
  if (typeof window === "undefined") return false;
  return hasInteractionTrackingConsent();
}

export function useTrackEntityView(
  entityType: InteractionEntityType,
  entityId: string | null | undefined,
  options?: EntityViewTrackingOptions
): void {
  useEffect(() => {
    if (!entityId) return;

    function trackView(): void {
      if (!entityId) return;
      if (hasInteractionTrackingConsent()) {
        queueInteraction({ entityType, entityId, action: "view" });
      }
      if (hasAnalyticsConsent()) {
        if (entityType === "tour") {
          trackTourView({
            slug: entityId,
            title: options?.title,
            priceUsd: options?.priceUsd,
            organizerId: options?.organizerId,
          });
        } else if (entityType === "excursion") {
          trackExcursionView({
            slug: entityId,
            title: options?.title,
            partner: options?.partner,
            cityName: options?.cityName,
          });
        }
      }
    }

    trackView();
    window.addEventListener(COOKIE_CONSENT_CHANGED_EVENT, trackView);
    return () => window.removeEventListener(COOKIE_CONSENT_CHANGED_EVENT, trackView);
  }, [
    entityType,
    entityId,
    options?.title,
    options?.priceUsd,
    options?.partner,
    options?.cityName,
    options?.organizerId,
  ]);
}

export function useInteractionConsentListener(onConsent: () => void): void {
  useEffect(() => {
    if (hasInteractionTrackingConsent()) {
      onConsent();
    }
    const handler = () => onConsent();
    window.addEventListener(COOKIE_CONSENT_CHANGED_EVENT, handler);
    return () => window.removeEventListener(COOKIE_CONSENT_CHANGED_EVENT, handler);
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
