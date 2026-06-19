"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  dismissPwaInstall,
  incrementPwaVisitCount,
  isIosSafari,
  isMobileDevice,
  isPwaInstallDismissed,
  isStandalonePwa,
} from "@/lib/pwa";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const MIN_VISITS = 2;

export default function InstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [iosHint, setIosHint] = useState(false);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isStandalonePwa() || isPwaInstallDismissed() || !isMobileDevice()) return;

    const visits = incrementPwaVisitCount();
    if (visits < MIN_VISITS) return;

    if (isIosSafari()) {
      setIosHint(true);
      setVisible(true);
      return;
    }

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      deferredPromptRef.current = event as BeforeInstallPromptEvent;
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  function close() {
    dismissPwaInstall();
    setVisible(false);
    deferredPromptRef.current = null;
  }

  async function install() {
    const promptEvent = deferredPromptRef.current;
    if (!promptEvent) return;
    await promptEvent.prompt();
    await promptEvent.userChoice;
    close();
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Установить приложение"
      className={cn(
        "fixed inset-x-4 z-[75] mx-auto flex max-w-md items-start gap-3 rounded-2xl border border-sky/25",
        "bg-white/95 p-4 shadow-elevated backdrop-blur-md",
        "bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] sm:bottom-[calc(1.25rem+env(safe-area-inset-bottom,0px))]"
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky/15 text-sky">
        {iosHint ? (
          <Share className="h-5 w-5" strokeWidth={1.75} aria-hidden />
        ) : (
          <Download className="h-5 w-5" strokeWidth={1.75} aria-hidden />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-charcoal">Установить на телефон</p>
        <p className="mt-1 text-xs leading-relaxed text-slate">
          {iosHint ? (
            <>
              Нажмите «Поделиться» в Safari, затем «На экран «Домой»», чтобы открывать сайт как
              приложение.
            </>
          ) : (
            <>Добавьте «Пора в Аргентину» на главный экран — быстрый доступ к турам без адресной строки.</>
          )}
        </p>
        {!iosHint ? (
          <button
            type="button"
            onClick={install}
            data-no-custom-cursor
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-sky px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-sky-dark"
          >
            Установить
          </button>
        ) : null}
      </div>

      <button
        type="button"
        onClick={close}
        data-no-custom-cursor
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate transition-colors hover:bg-charcoal/5 hover:text-charcoal"
        aria-label="Закрыть"
      >
        <X className="h-4 w-4" strokeWidth={2} aria-hidden />
      </button>
    </div>
  );
}
