"use client";

import { Suspense, useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import SiteGtmLoader from "@/components/analytics/SiteGtmLoader";
import YandexMetrika from "@/components/analytics/YandexMetrika";
import MessengerClickTracker from "@/components/analytics/MessengerClickTracker";
import {
  COOKIE_CONSENT_CHANGED_EVENT,
  hasAnalyticsConsent,
} from "@/lib/cookie-consent";
import { isGtmEnabled } from "@/lib/analytics/gtm-config";
import { isYandexMetrikaEnabled } from "@/lib/analytics/yandex-metrika-config";

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
      {enabled && isGtmEnabled() ? (
        <>
          <SiteGtmLoader />
          <MessengerClickTracker />
        </>
      ) : null}
      {enabled && isYandexMetrikaEnabled() ? (
        <Suspense fallback={null}>
          <YandexMetrika />
        </Suspense>
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
