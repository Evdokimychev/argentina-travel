"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAdminContext } from "@/context/AdminContext";
import {
  ADMIN_NAV_SECTION_LABELS,
  filterAdminNavItems,
} from "@/lib/admin/nav-config";
import { cn } from "@/lib/cn";

type PaletteItem = {
  id: string;
  href: string;
  label: string;
  description?: string;
  sectionLabel: string;
  searchText: string;
};

function normalizeSearch(value: string): string {
  return value.trim().toLowerCase();
}

export default function AdminCommandPalette() {
  const router = useRouter();
  const { capabilities } = useAdminContext();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items = useMemo<PaletteItem[]>(() => {
    return filterAdminNavItems(capabilities).map((item) => ({
      id: item.id,
      href: item.href,
      label: item.label,
      description: item.description,
      sectionLabel: ADMIN_NAV_SECTION_LABELS[item.section],
      searchText: [
        item.label,
        item.description,
        ADMIN_NAV_SECTION_LABELS[item.section],
        item.href,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase(),
    }));
  }, [capabilities]);

  const filtered = useMemo(() => {
    const normalized = normalizeSearch(query);
    if (!normalized) return items;
    return items.filter((item) => item.searchText.includes(normalized));
  }, [items, query]);

  const navigate = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery("");
      router.push(href);
    },
    [router]
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    function onOpenEvent() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("admin:command-palette-open", onOpenEvent);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("admin:command-palette-open", onOpenEvent);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    setActiveIndex(0);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((prev) => (filtered.length ? (prev + 1) % filtered.length : 0));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) =>
        filtered.length ? (prev - 1 + filtered.length) % filtered.length : 0
      );
      return;
    }
    if (event.key === "Enter" && filtered[activeIndex]) {
      event.preventDefault();
      navigate(filtered[activeIndex].href);
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="max-w-lg gap-0 overflow-hidden p-0 sm:max-w-lg"
        bottomSheet={false}
        showClose
      >
        <DialogHeader className="border-b border-gray-100 px-4 py-3">
          <DialogTitle className="text-base">Командная палитра</DialogTitle>
          <DialogDescription className="text-xs">
            Поиск разделов админ-панели · Cmd+K
          </DialogDescription>
        </DialogHeader>

        <div className="border-b border-gray-100 px-4 py-2">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 shrink-0 text-slate" aria-hidden />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={onInputKeyDown}
              placeholder="Раздел, страница, путь…"
              className="w-full bg-transparent text-sm text-charcoal outline-none placeholder:text-slate/70"
              aria-label="Поиск разделов"
            />
          </div>
        </div>

        <ul className="max-h-72 overflow-y-auto py-2" role="listbox">
          {filtered.length === 0 ? (
            <li className="px-4 py-6 text-center text-sm text-slate">Ничего не найдено</li>
          ) : (
            filtered.map((item, index) => (
              <li key={item.id} role="option" aria-selected={index === activeIndex}>
                <button
                  type="button"
                  onClick={() => navigate(item.href)}
                  className={cn(
                    "flex w-full flex-col gap-0.5 px-4 py-2.5 text-left transition-colors",
                    index === activeIndex ? "bg-sky/10" : "hover:bg-gray-50"
                  )}
                >
                  <span className="text-sm font-medium text-charcoal">{item.label}</span>
                  <span className="text-xs text-slate">
                    {item.sectionLabel}
                    {item.description ? ` · ${item.description}` : ""}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
