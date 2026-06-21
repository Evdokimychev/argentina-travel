"use client";

import { useEffect, useState } from "react";
import { DEFAULT_SITE_BRANDING } from "@/lib/cms/site-globals/normalize";

/** Client-side site name from public globals API (cached on CDN). */
export function useSiteBrandName(): string {
  const [siteName, setSiteName] = useState(DEFAULT_SITE_BRANDING.siteName);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/site/globals")
      .then((response) => (response.ok ? response.json() : null))
      .then((json: { siteName?: string } | null) => {
        if (cancelled || !json?.siteName?.trim()) return;
        setSiteName(json.siteName.trim());
      })
      .catch(() => {
        /* keep fallback */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return siteName;
}
