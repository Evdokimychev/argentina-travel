"use client";

import { useEffect } from "react";
import { isMobileDevice } from "@/lib/pwa";

/** Блокирует pull-to-refresh у верхнего края на мобильных (PWA и браузер). */
export default function PullToRefreshGuard() {
  useEffect(() => {
    if (!isMobileDevice()) return;

    let startY = 0;
    let tracking = false;

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      startY = event.touches[0].clientY;
      tracking = window.scrollY <= 0;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!tracking || event.touches.length !== 1) return;
      const deltaY = event.touches[0].clientY - startY;
      if (deltaY > 0 && window.scrollY <= 0) {
        event.preventDefault();
      }
    };

    const onTouchEnd = () => {
      tracking = false;
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    document.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("touchcancel", onTouchEnd);
    };
  }, []);

  return null;
}
