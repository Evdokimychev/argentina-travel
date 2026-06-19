"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { captureFirstTouchFromLocation } from "@/lib/attribution/first-touch";

/** Persists first-touch UTM/referrer in sessionStorage and cookie for checkout attribution. */
export default function FirstTouchAttributionCapture() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    captureFirstTouchFromLocation(new URLSearchParams(searchParams.toString()));
  }, [pathname, searchParams]);

  return null;
}
