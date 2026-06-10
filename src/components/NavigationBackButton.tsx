"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useAdaptiveFloatingTone } from "@/hooks/useAdaptiveFloatingTone";
import { floatingChromeButtonClass } from "@/lib/floating-chrome-button";

export default function NavigationBackButton() {
  const router = useRouter();
  const pathname = usePathname();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const tone = useAdaptiveFloatingTone(buttonRef, canGoBack);

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

  if (!canGoBack) return null;

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={() => router.back()}
      data-no-custom-cursor
      data-floating-chrome="true"
      className={floatingChromeButtonClass(
        tone === "dark",
        "fixed left-4 z-[90] top-[calc(var(--site-header-height,72px)+1rem)]"
      )}
      aria-label="Назад"
    >
      <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
    </button>
  );
}
