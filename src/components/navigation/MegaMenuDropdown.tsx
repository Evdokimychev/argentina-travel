"use client";

import { createPortal } from "react-dom";
import { useRef, type MouseEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import {
  ANCHORED_PANEL_HOVER_BRIDGE_PX,
  useAnchoredPanelPosition,
} from "@/hooks/useAnchoredPanelPosition";

type MegaMenuDropdownProps = {
  open: boolean;
  triggerRef: React.RefObject<HTMLElement | null>;
  panelRef?: React.RefObject<HTMLDivElement | null>;
  widthClass: string;
  onMouseEnter?: (event: MouseEvent) => void;
  onMouseLeave?: (event: MouseEvent) => void;
  children: ReactNode;
};

export function MegaMenuDropdown({
  open,
  triggerRef,
  panelRef: panelRefProp,
  widthClass,
  onMouseEnter,
  onMouseLeave,
  children,
}: MegaMenuDropdownProps) {
  const internalPanelRef = useRef<HTMLDivElement>(null);
  const panelRef = panelRefProp ?? internalPanelRef;
  const coords = useAnchoredPanelPosition(open, triggerRef, panelRef);
  const mounted = typeof document !== "undefined";

  if (!open || !mounted) return null;

  return createPortal(
    <div
      ref={panelRef}
      className={cn(
        "fixed z-[110]",
        widthClass,
        coords ? "opacity-100" : "pointer-events-none opacity-0",
      )}
      style={
        coords
          ? { top: coords.top, left: coords.left }
          : { top: 0, left: 0, visibility: "hidden" as const }
      }
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Shared hover zone — bridges the gap between trigger and panel. */}
      <div
        className="pointer-events-auto"
        style={{ height: ANCHORED_PANEL_HOVER_BRIDGE_PX }}
        aria-hidden
      />
      <div
        className={cn(
          "pointer-events-auto max-h-[min(70vh,calc(100dvh-var(--site-header-height,4rem)-1.5rem))] overflow-y-auto overscroll-contain rounded-2xl border border-border-subtle bg-surface-elevated shadow-modal",
        )}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
