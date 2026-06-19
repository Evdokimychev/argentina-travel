"use client";

import { useEffect } from "react";
import InstallPrompt from "@/components/pwa/InstallPrompt";
import PullToRefreshGuard from "@/components/pwa/PullToRefreshGuard";

/** Клиентская оболочка PWA: жесты, подсказка установки, регистрация SW в production. */
export default function PwaShell() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      /* регистрация опциональна — см. docs/pwa-e65.md */
    });
  }, []);

  return (
    <>
      <PullToRefreshGuard />
      <InstallPrompt />
    </>
  );
}
