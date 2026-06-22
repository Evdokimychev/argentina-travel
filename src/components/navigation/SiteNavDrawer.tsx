"use client";

import { useEffect, useRef, type RefObject } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { MobileSiteNavMenu } from "@/components/navigation/MobileSiteNavMenu";
import type { NavTranslate } from "@/lib/site-nav";
import type { SiteNavSection } from "@/types/site-nav";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function SiteNavFullScreenOverlay({
  open,
  onClose,
  title,
  sections,
  pathname,
  t,
  returnFocusRef,
  headerActions,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  sections: SiteNavSection[];
  pathname: string;
  t: NavTranslate;
  returnFocusRef?: RefObject<HTMLElement | null>;
  headerActions?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const mounted = typeof document !== "undefined";

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    scrollRef.current?.scrollTo({ top: 0, behavior: "instant" });
  }, [open, pathname]);

  useEffect(() => {
    if (!open) return;

    closeButtonRef.current?.focus();

    const panel = panelRef.current;
    if (!panel) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (open || !returnFocusRef?.current) return;
    returnFocusRef.current.focus();
  }, [open, returnFocusRef]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] lg:hidden">
      <div
        className="absolute inset-0 bg-charcoal/45 backdrop-blur-sm"
        aria-hidden
        onClick={onClose}
      />
      <div
        ref={panelRef}
        id="site-nav-overlay"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex h-dvh max-h-dvh flex-col bg-surface-elevated"
      >
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border-subtle px-3 py-3 sm:px-4">
          <p className="min-w-0 truncate font-heading text-base font-semibold text-charcoal sm:text-lg">
            {title}
          </p>
          <div className="flex shrink-0 items-center gap-1">
            {headerActions}
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border-subtle bg-surface-elevated text-foreground transition-colors hover:border-sky/40 hover:bg-sky/5 hover:text-sky focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40"
              aria-label="Закрыть"
            >
              <X className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="mobile-nav-scroll min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-y-contain px-3 py-4 sm:px-4 sm:py-5"
        >
          <MobileSiteNavMenu
            sections={sections}
            pathname={pathname}
            t={t}
            open={open}
            onNavigate={onClose}
            scrollContainerRef={scrollRef}
          />
        </div>

        {footer ? (
          <div className="shrink-0 border-t border-border-subtle bg-surface-elevated/95 px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:px-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
