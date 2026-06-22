"use client";

import { useCallback, useEffect, useState } from "react";

function getScrollProgress(): number {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  if (scrollable <= 0) return 0;
  return Math.min(1, Math.max(0, window.scrollY / scrollable));
}

export default function ArticleReadingProgress() {
  const [progress, setProgress] = useState(0);

  const update = useCallback(() => {
    setProgress(getScrollProgress());
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

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[90] h-0.5 bg-gray-100/80"
      role="progressbar"
      aria-valuenow={Math.round(progress * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Прогресс чтения"
    >
      <div
        className="h-full bg-sky transition-[width] duration-150 ease-out motion-reduce:transition-none"
        style={{ width: `${progress * 100}%` }}
      />
    </div>
  );
}
