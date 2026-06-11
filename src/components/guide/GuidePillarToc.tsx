"use client";

import type { MouseEvent } from "react";
import type { GuidePillarSection, GuidePillarWidgetSlot } from "@/types/guide-pillar";
import { scrollToSiteAnchor } from "@/lib/scroll-anchor";

type GuidePillarTocProps = {
  sections: GuidePillarSection[];
  widgetSlots?: GuidePillarWidgetSlot[];
  variant: "sidebar" | "mobile";
};

const EXTRA_LINKS = [
  { id: "recommend", label: "Рекомендуем" },
  { id: "read-more", label: "Читайте также" },
  { id: "faq", label: "FAQ" },
  { id: "cta", label: "Контакты" },
] as const;

function handleAnchorClick(id: string) {
  return (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    scrollToSiteAnchor(id);
  };
}

export default function GuidePillarToc({ sections, widgetSlots, variant }: GuidePillarTocProps) {
  const widgetLinks = widgetSlots ?? [];

  if (variant === "sidebar") {
    return (
      <aside className="hidden lg:block">
        <nav
          className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-2xl border border-gray-100 bg-white p-5 shadow-card"
          aria-label="Содержание"
        >
          <p className="font-heading text-sm font-bold text-charcoal">Содержание</p>
          <ol className="mt-3 space-y-2 text-sm">
            {sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  onClick={handleAnchorClick(section.id)}
                  className="text-slate transition-colors hover:text-sky"
                >
                  {section.title}
                </a>
              </li>
            ))}
            {widgetLinks.map((slot) => (
              <li key={slot.id}>
                <a href={`#${slot.id}`} onClick={handleAnchorClick(slot.id)} className="text-slate transition-colors hover:text-sky">
                  {slot.label}
                </a>
              </li>
            ))}
            {EXTRA_LINKS.map((link) => (
              <li key={link.id}>
                <a href={`#${link.id}`} onClick={handleAnchorClick(link.id)} className="text-slate transition-colors hover:text-sky">
                  {link.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </aside>
    );
  }

  return (
    <nav
      className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card lg:hidden"
      aria-label="Содержание"
    >
      <details className="group">
        <summary className="cursor-pointer list-none font-heading text-sm font-bold text-charcoal marker:content-none [&::-webkit-details-marker]:hidden">
          <span className="flex items-center justify-between">
            Содержание
            <span className="text-xs font-normal text-slate group-open:hidden">развернуть</span>
          </span>
        </summary>
        <ol className="mt-3 flex flex-wrap gap-2">
          {sections.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                onClick={handleAnchorClick(section.id)}
                className="inline-block rounded-full border border-gray-200 bg-surface-muted/60 px-3 py-1.5 text-xs text-charcoal transition-colors hover:border-sky/40 hover:text-sky"
              >
                {section.title}
              </a>
            </li>
          ))}
          {widgetLinks.map((slot) => (
            <li key={slot.id}>
              <a
                href={`#${slot.id}`}
                onClick={handleAnchorClick(slot.id)}
                className="inline-block rounded-full border border-gray-200 bg-surface-muted/60 px-3 py-1.5 text-xs text-charcoal transition-colors hover:border-sky/40 hover:text-sky"
              >
                {slot.label}
              </a>
            </li>
          ))}
          {EXTRA_LINKS.map((link) => (
            <li key={link.id}>
              <a
                href={`#${link.id}`}
                onClick={handleAnchorClick(link.id)}
                className="inline-block rounded-full border border-gray-200 bg-surface-muted/60 px-3 py-1.5 text-xs text-charcoal transition-colors hover:border-sky/40 hover:text-sky"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ol>
      </details>
    </nav>
  );
}
