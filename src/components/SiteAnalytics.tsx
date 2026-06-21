"use client";

import { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import SiteGtmLoader from "@/components/analytics/SiteGtmLoader";
import MessengerClickTracker from "@/components/analytics/MessengerClickTracker";
import {
  COOKIE_CONSENT_CHANGED_EVENT,
  hasAnalyticsConsent,
} from "@/lib/cookie-consent";
import { isGtmEnabled } from "@/lib/analytics/gtm-config";

/** Vercel Analytics + GTM (via consent) — see legal/cookies. */
export default function SiteAnalytics() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(hasAnalyticsConsent());

    const onConsent = () => setEnabled(hasAnalyticsConsent());
    window.addEventListener(COOKIE_CONSENT_CHANGED_EVENT, onConsent);
    return () => window.removeEventListener(COOKIE_CONSENT_CHANGED_EVENT, onConsent);
  }, []);

  return (
    <>
      {isGtmEnabled() ? (
        <>
          <SiteGtmLoader />
          <MessengerClickTracker />
        </>
      ) : null}
      {enabled ? (
        <>
          <Analytics />
          <SpeedInsights />
        </>
      ) : null}
    </>
  );
}
