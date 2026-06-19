"use client";

import { useEffect } from "react";
import { SITE_HEADER_CHROME_CHANGE_EVENT } from "@/lib/site-header-chrome";

export function useSiteHeaderChromeChange(onChange: () => void) {
  useEffect(() => {
    window.addEventListener(SITE_HEADER_CHROME_CHANGE_EVENT, onChange);
    return () => window.removeEventListener(SITE_HEADER_CHROME_CHANGE_EVENT, onChange);
  }, [onChange]);
}
