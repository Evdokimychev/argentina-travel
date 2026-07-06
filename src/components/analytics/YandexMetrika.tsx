"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { isYandexMetrikaEnabled } from "@/lib/analytics/yandex-metrika-config";
import {
  getConfiguredYandexMetrikaCounterId,
  hitYandexMetrikaPage,
  initYandexMetrika,
  resolveYandexMetrikaPageUrl,
} from "@/lib/analytics/yandex-metrika";

/** Tracks SPA navigations via ym hit(); loader + init live in YandexMetrikaHeadScripts. */
export default function YandexMetrika() {
  const counterId = getConfiguredYandexMetrikaCounterId();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialized = useRef(false);
  const skipRouteHit = useRef(false);
  const previousUrl = useRef<string | null>(null);

  useEffect(() => {
    if (!isYandexMetrikaEnabled() || counterId === null) return;

    let cancelled = false;
    let intervalId: number | undefined;

    const bootstrap = () => {
      if (cancelled || initialized.current) return true;
      if (!initYandexMetrika(counterId)) return false;

      initialized.current = true;
      const initialUrl = window.location.href;
      hitYandexMetrikaPage(counterId, initialUrl, { title: document.title });
      previousUrl.current = initialUrl;
      skipRouteHit.current = true;
      return true;
    };

    if (!bootstrap()) {
      intervalId = window.setInterval(() => {
        if (bootstrap() && intervalId !== undefined) {
          window.clearInterval(intervalId);
        }
      }, 100);
    }

    return () => {
      cancelled = true;
      if (intervalId !== undefined) window.clearInterval(intervalId);
    };
  }, [counterId]);

  useEffect(() => {
    if (!isYandexMetrikaEnabled() || counterId === null || !initialized.current) return;

    if (skipRouteHit.current) {
      skipRouteHit.current = false;
      return;
    }

    const search = searchParams?.toString() ?? "";
    const url = resolveYandexMetrikaPageUrl(pathname, search);
    hitYandexMetrikaPage(counterId, url, {
      title: document.title,
      ...(previousUrl.current ? { referer: previousUrl.current } : {}),
    });
    previousUrl.current = url;
  }, [counterId, pathname, searchParams]);

  return null;
}
