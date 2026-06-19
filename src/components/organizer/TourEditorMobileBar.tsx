"use client";

import { ClipboardCheck, FileEdit, LayoutPanelLeft } from "lucide-react";
import { cn } from "@/lib/cn";

export type TourEditorMobilePanelId = "editor" | "status" | "preview";

interface TourEditorMobileBarProps {
  active: TourEditorMobilePanelId;
  onChange: (panel: TourEditorMobilePanelId) => void;
  completionPercent: number;
}

const PANELS: {
  id: TourEditorMobilePanelId;
  label: string;
  icon: typeof FileEdit;
}[] = [
  { id: "editor", label: "Редактор", icon: FileEdit },
  { id: "status", label: "Готовность", icon: ClipboardCheck },
  { id: "preview", label: "Карточка", icon: LayoutPanelLeft },
];

export default function TourEditorMobileBar({
  active,
  onChange,
  completionPercent,
}: TourEditorMobileBarProps) {
  return (
    <nav
      aria-label="Панели редактора тура"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_24px_rgba(0,0,0,0.06)] backdrop-blur-md xl:hidden"
    >
      <div className="mx-auto flex max-w-lg">
        {PANELS.map((panel) => {
          const Icon = panel.icon;
          const isActive = active === panel.id;
          return (
            <button
              key={panel.id}
              type="button"
              onClick={() => onChange(panel.id)}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-0.5 px-2 py-2.5 text-[11px] font-medium transition-colors",
                isActive ? "text-brand" : "text-slate hover:text-charcoal"
              )}
            >
              <Icon className="h-5 w-5" aria-hidden />
              {panel.label}
              {panel.id === "status" ? (
                <span className="absolute right-[calc(50%-1.75rem)] top-1.5 rounded-full bg-brand px-1 text-[9px] font-bold tabular-nums text-white">
                  {completionPercent}%
                </span>
              ) : null}
              {isActive ? (
                <span className="absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-brand" aria-hidden />
              ) : null}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
