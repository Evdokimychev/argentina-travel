"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeftRight,
  BookOpen,
  Building2,
  Calculator,
  Car,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  CloudSun,
  Compass,
  FileText,
  Flag,
  Globe,
  Grid3X3,
  Lightbulb,
  Link2,
  ListOrdered,
  Map,
  MapPin,
  Megaphone,
  MessageCircle,
  Plane,
  Route,
  Scale,
  Search,
  Shield,
  ShieldAlert,
  Sparkles,
  Stamp,
  Timer,
  UserCheck,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { hubTocStickyMaxHeightClass, hubTocStickyTopClass } from "@/lib/site-container";
import type { TravelHubTocItem } from "@/types/guide-travel-hub";

const TOC_COLLAPSED_KEY = "guide-hub-toc-collapsed";
const AUTO_COLLAPSE_MAX_WIDTH = 1279;

const TOC_ICONS: Record<string, LucideIcon> = {
  "quick-30": Timer,
  planning: Compass,
  "topics-practice": Wrench,
  "topics-travel": Map,
  "topics-country": Globe,
  "all-topics": Grid3X3,
  related: Link2,
  "transport-modes": Plane,
  aviasales: Search,
  airports: MapPin,
  "domestic-airlines": Building2,
  "domestic-routes": Route,
  "entry-docs": FileText,
  insurance: Shield,
  transfers: Car,
  "eze-aep": ArrowLeftRight,
  tips: Lightbulb,
  articles: BookOpen,
  faq: CircleHelp,
  cta: MessageCircle,
  "why-argentina": Globe,
  "tourist-entry": Stamp,
  "residency-types": UserCheck,
  "grounds-14": ListOrdered,
  "path-steps": Flag,
  "dnu-2025": ShieldAlert,
  documents: ClipboardList,
  "radex-process": FileText,
  alternatives: Scale,
  "hub-overview": Grid3X3,
  "life-in-country": Globe,
  "immigration-process": Stamp,
  birth: UserCheck,
  citizenship: Flag,
  residency: ListOrdered,
  opportunities: Lightbulb,
  "useful-links": Link2,
  "practical-tips": Lightbulb,
  recommend: Sparkles,
  "read-more": BookOpen,
  "widget-exchange-rates": ArrowLeftRight,
  "widget-calculator": Calculator,
  "widget-map": Map,
  "widget-weather-panel": CloudSun,
  "widget-promo": Megaphone,
};

function resolveTocIcon(id: string): LucideIcon {
  if (TOC_ICONS[id]) return TOC_ICONS[id];
  if (id.startsWith("widget-")) return Wrench;
  return FileText;
}

type HubTocProps = {
  items: TravelHubTocItem[];
  variant: "sidebar" | "mobile";
};

function readCollapsedPreference(): boolean {
  try {
    return window.localStorage.getItem(TOC_COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

function writeCollapsedPreference(collapsed: boolean) {
  try {
    window.localStorage.setItem(TOC_COLLAPSED_KEY, collapsed ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export default function HubToc({ items, variant }: HubTocProps) {
  if (variant === "mobile") {
    return <HubTocMobile items={items} />;
  }
  return <HubTocSidebar items={items} />;
}

function HubTocSidebar({ items }: { items: TravelHubTocItem[] }) {
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null);
  const isCompact = collapsed;

  useEffect(() => {
    function syncCollapsedState() {
      if (window.innerWidth <= AUTO_COLLAPSE_MAX_WIDTH) {
        setCollapsed(true);
        return;
      }
      setCollapsed(readCollapsedPreference());
    }

    syncCollapsedState();
    setHydrated(true);
    window.addEventListener("resize", syncCollapsedState, { passive: true });
    return () => window.removeEventListener("resize", syncCollapsedState);
  }, []);

  useEffect(() => {
    const ids = [...items.map((i) => i.id), "cta"];
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0, 0.25, 0.5] }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [items]);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      writeCollapsedPreference(next);
      return next;
    });
  }

  if (!hydrated) {
    return (
      <aside className="hidden w-[240px] shrink-0 lg:block">
        <div className={cn("sticky h-[320px] rounded-3xl border border-gray-200 bg-white shadow-sm", hubTocStickyTopClass)} />
      </aside>
    );
  }

  const navItems = [
    ...items,
    { id: "cta", label: "Контакты" },
  ];

  return (
    <aside
      className={cn(
        "sticky hidden h-fit shrink-0 flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition-[width] duration-300 ease-out lg:flex",
        hubTocStickyTopClass,
        hubTocStickyMaxHeightClass,
        isCompact ? "w-[72px]" : "w-[240px]"
      )}
    >
      <div
        className={cn(
          "shrink-0 border-b border-gray-100",
          isCompact ? "px-2.5 py-3" : "px-4 py-4"
        )}
      >
        {isCompact ? (
          <p className="text-center text-[10px] font-bold uppercase tracking-wider text-slate" title="Содержание">
            TOC
          </p>
        ) : (
          <p className="font-display text-sm font-bold text-charcoal">Содержание</p>
        )}
      </div>

      <nav
        className={cn("min-h-0 flex-1 overflow-y-auto scrollbar-hide", isCompact ? "px-2 py-2" : "px-2 py-3")}
        aria-label="Содержание"
      >
        <ol className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = resolveTocIcon(item.id);
            const active = activeId === item.id;

            return (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  title={isCompact ? item.label : undefined}
                  aria-label={item.label}
                  aria-current={active ? "location" : undefined}
                  className={cn(
                    "flex items-center rounded-xl text-sm font-medium transition-colors",
                    isCompact ? "justify-center px-2 py-2.5" : "gap-2.5 px-2.5 py-2",
                    active
                      ? "bg-sky/10 text-sky"
                      : "text-slate hover:bg-gray-50 hover:text-charcoal"
                  )}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} aria-hidden />
                  {!isCompact ? (
                    <span className="min-w-0 flex-1 text-[13px] leading-snug">{item.label}</span>
                  ) : null}
                </a>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className={cn("shrink-0 border-t border-gray-100", isCompact ? "p-2" : "px-3 py-3")}>
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-expanded={!isCompact}
          aria-label={isCompact ? "Развернуть содержание" : "Свернуть содержание"}
          className={cn(
            "flex w-full items-center rounded-xl border border-gray-200 bg-white text-slate transition-colors hover:bg-gray-50 hover:text-charcoal",
            isCompact ? "justify-center p-2" : "gap-2 px-3 py-2 text-sm font-medium"
          )}
        >
          {isCompact ? (
            <ChevronRight className="h-4 w-4 shrink-0" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 shrink-0" />
              <span>Свернуть</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

function HubTocMobile({ items }: { items: TravelHubTocItem[] }) {
  return (
    <nav
      className="rounded-2xl border border-gray-100 bg-white p-4 shadow-card lg:hidden"
      aria-label="Содержание"
    >
      <details className="group">
        <summary className="cursor-pointer list-none font-display text-sm font-bold text-charcoal marker:content-none [&::-webkit-details-marker]:hidden">
          <span className="flex items-center justify-between">
            Содержание
            <span className="text-xs font-normal text-slate group-open:hidden">развернуть</span>
          </span>
        </summary>
        <ol className="mt-3 flex flex-wrap gap-2">
          {items.map((item) => {
            const Icon = resolveTocIcon(item.id);
            return (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-surface-muted/60 px-3 py-1.5 text-xs text-charcoal transition-colors hover:border-sky/40 hover:text-sky"
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
                  {item.label}
                </a>
              </li>
            );
          })}
          <li>
            <a
              href="#cta"
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-surface-muted/60 px-3 py-1.5 text-xs text-charcoal transition-colors hover:border-sky/40 hover:text-sky"
            >
              <MessageCircle className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
              Контакты
            </a>
          </li>
        </ol>
      </details>
    </nav>
  );
}
