"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export function useCanGoBack(): boolean {
  const pathname = usePathname();
  const [canGoBack, setCanGoBack] = useState(false);
  const previousPathRef = useRef(pathname);

  useEffect(() => {
    if (pathname === "/") {
      setCanGoBack(false);
      return;
    }

    const navigatedInsideApp = previousPathRef.current !== pathname;
    let sameOriginReferrer = false;
    try {
      sameOriginReferrer =
        Boolean(document.referrer) && new URL(document.referrer).origin === window.location.origin;
    } catch {
      sameOriginReferrer = false;
    }

    setCanGoBack(navigatedInsideApp || sameOriginReferrer);
    previousPathRef.current = pathname;
  }, [pathname]);

  return canGoBack;
}
