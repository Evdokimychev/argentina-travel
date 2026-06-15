"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import { getBackgroundToneAt, type BackgroundTone } from "@/lib/background-tone-at-point";
import { floatingChromeButtonClass } from "@/lib/floating-chrome-button";
import { floatingChromeInsetClass } from "@/lib/site-container";
import { cn } from "@/lib/cn";

const SHOW_AFTER_PX = 160;
const TRACK_HEIGHT_PX = 72;

function getScrollProgress(): number {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  if (scrollable <= 0) return 0;
  return Math.min(1, Math.max(0, window.scrollY / scrollable));
}

function sampleRailTone(button: HTMLElement): BackgroundTone {
  const rect = button.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const samples = [0.3, 0.5, 0.72].map((ratio) =>
    getBackgroundToneAt(x, rect.top + rect.height * ratio, button)
  );

  const darkVotes = samples.filter((tone) => tone === "dark").length;
  return darkVotes >= 2 ? "dark" : "light";
}

export default function ScrollNavigationRail() {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [tone, setTone] = useState<BackgroundTone>("light");

  const update = useCallback(() => {
    const nextProgress = getScrollProgress();
    setProgress(nextProgress);
    setVisible(window.scrollY >= SHOW_AFTER_PX && document.documentElement.scrollHeight > window.innerHeight + 80);

    const button = buttonRef.current;
    if (button) {
      setTone(sampleRailTone(button));
    }
  }, []);

  useEffect(() => {
    update();

    let raf = 0;
    const scheduleUpdate = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        update();
      });
    };

    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [update]);

  useEffect(() => {
    if (!visible) return;
    update();
  }, [visible, update]);

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!visible) return null;

  const onDark = tone === "dark";

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={scrollToTop}
      data-no-custom-cursor
      data-floating-chrome="true"
      className={cn(
        "group fixed top-1/2 z-[85] hidden -translate-y-1/2 sm:flex",
        floatingChromeInsetClass,
        "flex-col items-center gap-2 transition-opacity duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40 focus-visible:ring-offset-2"
      )}
      aria-label="Прокрутить наверх"
    >
      <span className={floatingChromeButtonClass(onDark)} aria-hidden>
        <ArrowUp className="h-4 w-4" strokeWidth={2} aria-hidden />
      </span>

      <span
        className={cn(
          "relative block w-px overflow-hidden rounded-full transition-colors duration-200",
          onDark ? "bg-white/25" : "bg-gray-200/90"
        )}
        style={{ height: TRACK_HEIGHT_PX }}
        aria-hidden
      >
        <span
          className={cn(
            "absolute left-0 top-0 w-full rounded-full transition-[height,background-color] duration-150",
            onDark ? "bg-white/90 group-hover:bg-sky" : "bg-charcoal/70 group-hover:bg-sky"
          )}
          style={{ height: `${Math.max(progress * 100, 4)}%` }}
        />
      </span>
    </button>
  );
}
