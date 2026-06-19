"use client";

import { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import {
  COOKIE_CONSENT_CHANGED_EVENT,
  hasAnalyticsConsent,
} from "@/lib/cookie-consent";

/** Vercel Analytics + Speed Insights — only after analytics consent (see legal/cookies). */
export default function SiteAnalytics() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(hasAnalyticsConsent());

    const onConsent = () => setEnabled(hasAnalyticsConsent());
    window.addEventListener(COOKIE_CONSENT_CHANGED_EVENT, onConsent);
    return () => window.removeEventListener(COOKIE_CONSENT_CHANGED_EVENT, onConsent);
  }, []);

  if (!enabled) return null;

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
