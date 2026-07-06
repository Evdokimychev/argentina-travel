"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { isYandexMetrikaEnabled } from "@/lib/analytics/yandex-metrika-config";
import {
  getConfiguredYandexMetrikaCounterId,
  hitYandexMetrikaPage,
  resolveYandexMetrikaPageUrl,
  waitForYandexMetrikaReady,
} from "@/lib/analytics/yandex-metrika";

/** Tracks SPA navigations via ym hit(); loader + init + first hit live in YandexMetrikaHeadScripts. */
export default function YandexMetrika() {
  const counterId = getConfiguredYandexMetrikaCounterId();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previousUrl = useRef<string | null>(null);

  useEffect(() => {
    if (!isYandexMetrikaEnabled() || counterId === null) return;

    let cancelled = false;

    void waitForYandexMetrikaReady(counterId).then((ready) => {
      if (cancelled || !ready) return;

      const search = searchParams?.toString() ?? "";
      const url = resolveYandexMetrikaPageUrl(pathname, search);

      if (previousUrl.current === null) {
        previousUrl.current = url;
        if (!window.__goArgentinaYmFirstHitSent) {
          hitYandexMetrikaPage(counterId, url, { title: document.title });
          window.__goArgentinaYmFirstHitSent = true;
        }
        return;
      }

      if (url === previousUrl.current) return;

      hitYandexMetrikaPage(counterId, url, {
        title: document.title,
        referer: previousUrl.current,
      });
      previousUrl.current = url;
    });

    return () => {
      cancelled = true;
    };
  }, [counterId, pathname, searchParams]);

  return null;
}
