"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/cn";

export default function NavigationBackButton() {
  const router = useRouter();
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

  if (!canGoBack) return null;

  return (
    <button
      type="button"
      onClick={() => router.back()}
      data-no-custom-cursor
      className={cn(
        "fixed left-4 z-[90] flex h-10 w-10 items-center justify-center rounded-full",
        "bg-charcoal/10 text-charcoal/65 shadow-sm backdrop-blur-sm transition-colors",
        "hover:bg-charcoal/18 hover:text-charcoal/90",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal/20 focus-visible:ring-offset-2",
        "top-[calc(var(--site-header-height,72px)+1rem)]"
      )}
      aria-label="Назад"
    >
      <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
    </button>
  );
}
