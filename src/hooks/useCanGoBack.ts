"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function useCanGoBack(): boolean {
  const pathname = usePathname();
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    if (pathname === "/") {
      setCanGoBack(false);
      return;
    }

    const sameOriginReferrer =
      typeof document !== "undefined" &&
      Boolean(document.referrer) &&
      new URL(document.referrer).origin === window.location.origin;

    setCanGoBack(window.history.length > 1 || sameOriginReferrer);
  }, [pathname]);

  return canGoBack;
}
