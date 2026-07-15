"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  captureFirstTouchFromLocation,
  clearFirstTouchAttribution,
} from "@/lib/attribution/first-touch";
import {
  COOKIE_CONSENT_CHANGED_EVENT,
  hasPersonalizationConsent,
} from "@/lib/cookie-consent";

/** Persists first-touch UTM/referrer in sessionStorage and cookie for checkout attribution. */
export default function FirstTouchAttributionCapture() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const sync = () => {
      if (hasPersonalizationConsent()) {
        captureFirstTouchFromLocation(new URLSearchParams(searchParams.toString()));
      } else {
        clearFirstTouchAttribution();
      }
    };
    sync();
    window.addEventListener(COOKIE_CONSENT_CHANGED_EVENT, sync);
    return () => window.removeEventListener(COOKIE_CONSENT_CHANGED_EVENT, sync);
  }, [pathname, searchParams]);

  return null;
}
