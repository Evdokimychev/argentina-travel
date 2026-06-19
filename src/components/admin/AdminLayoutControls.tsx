"use client";

import { Moon, Rows3, Search } from "lucide-react";
import { useAdminLayoutPrefs } from "@/context/AdminLayoutPrefsContext";
import { cn } from "@/lib/cn";

const COMMAND_PALETTE_EVENT = "admin:command-palette-open";

function ToggleButton({
  active,
  onClick,
  label,
  icon: Icon,
  className,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: typeof Rows3;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-colors",
        active
          ? "bg-sky/15 text-sky ring-1 ring-sky/20"
          : "admin-layout-toggle text-slate hover:bg-gray-50 hover:text-charcoal",
        className
      )}
      aria-pressed={active}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {label}
    </button>
  );
}

export function AdminDenseTableToggle({ className }: { className?: string }) {
  const { denseTables, toggleDenseTables } = useAdminLayoutPrefs();

  return (
    <ToggleButton
      active={denseTables}
      onClick={toggleDenseTables}
      label="Компактные таблицы"
      icon={Rows3}
      className={className}
    />
  );
}

export function AdminDarkSidebarToggle({ className }: { className?: string }) {
  const { darkSidebar, toggleDarkSidebar } = useAdminLayoutPrefs();

  return (
    <ToggleButton
      active={darkSidebar}
      onClick={toggleDarkSidebar}
      label="Тёмный сайдбар"
      icon={Moon}
      className={className}
    />
  );
}

export function openAdminCommandPalette() {
  window.dispatchEvent(new Event(COMMAND_PALETTE_EVENT));
}

export function AdminCommandPaletteButton() {
  return (
    <button
      type="button"
      onClick={() => openAdminCommandPalette()}
      className="admin-layout-control flex w-full items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-left text-xs text-slate transition-colors hover:border-sky/30 hover:bg-gray-50 hover:text-charcoal"
    >
      <Search className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span className="flex-1 truncate">Поиск разделов…</span>
      <kbd className="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 font-mono text-[10px] text-slate">
        ⌘K
      </kbd>
    </button>
  );
}
