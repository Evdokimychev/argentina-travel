"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Mail, MapPin } from "lucide-react";
import BlogCard from "@/components/blog/BlogCard";
import { BLOG_EDITORIAL } from "@/data/blog-author";
import { BLOG_HUB_LINKS } from "@/data/blog-hub-links";
import { SITE_EMAIL, SITE_OFFICE, SITE_PHONES } from "@/data/site-contacts";
import { cn } from "@/lib/cn";
import { hubTocStickyMaxHeightClass, hubTocStickyTopClass } from "@/lib/site-container";
import type { BlogPost } from "@/types";

const BLOG_SIDEBAR_KEY = "blog-sidebar-collapsed";
const AUTO_COLLAPSE_MAX_WIDTH = 1279;

type BlogSidebarProps = {
  freshPosts: BlogPost[];
  hubFreshPosts?: BlogPost[];
  hubLabel?: string;
  hubHref?: string;
  /** По умолчанию показывать материалы из хаба, если доступны. */
  defaultHubScope?: boolean;
  className?: string;
  embedded?: boolean;
};

function readCollapsed(): boolean {
  try {
    return window.localStorage.getItem(BLOG_SIDEBAR_KEY) === "1";
  } catch {
    return false;
  }
}

function writeCollapsed(value: boolean) {
  try {
    window.localStorage.setItem(BLOG_SIDEBAR_KEY, value ? "1" : "0");
  } catch {
    /* ignore */
  }
}

const hubLinkIcon = (type: string) => {
  switch (type) {
    case "guide":
      return "📘";
    case "immigration":
      return "🛂";
    case "tour":
      return "🧭";
    default:
      return "📄";
  }
};

export default function BlogSidebar({
  freshPosts,
  hubFreshPosts,
  hubLabel,
  hubHref,
  defaultHubScope = false,
  className,
  embedded = false,
}: BlogSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const hasHubScope = Boolean(hubFreshPosts?.length && hubLabel);
  const [hubScope, setHubScope] = useState(defaultHubScope && hasHubScope);

  useEffect(() => {
    function sync() {
      if (window.innerWidth <= AUTO_COLLAPSE_MAX_WIDTH) {
        setCollapsed(true);
        return;
      }
      setCollapsed(readCollapsed());
    }
    sync();
    setHydrated(true);
    window.addEventListener("resize", sync, { passive: true });
    return () => window.removeEventListener("resize", sync);
  }, []);

  useEffect(() => {
    if (defaultHubScope && hasHubScope) {
      setHubScope(true);
    }
  }, [defaultHubScope, hasHubScope]);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      writeCollapsed(next);
      return next;
    });
  }

  const displayedFreshPosts =
    hubScope && hubFreshPosts?.length ? hubFreshPosts : freshPosts;

  if (!hydrated) {
    return (
      <aside
        className={cn(
          embedded ? "block w-full" : "hidden w-[280px] shrink-0 xl:block",
          className
        )}
      >
        <div
          className={cn(
            "h-[420px] rounded-3xl border border-gray-100 bg-white shadow-card",
            !embedded && hubTocStickyTopClass
          )}
        />
      </aside>
    );
  }

  return (
    <aside
      aria-label="Боковая панель блога"
      className={cn(
        embedded
          ? "flex w-full flex-col"
          : "sticky hidden h-fit shrink-0 flex-col overflow-hidden transition-[width] duration-300 ease-out xl:flex",
        !embedded && hubTocStickyTopClass,
        !embedded && hubTocStickyMaxHeightClass,
        "rounded-3xl border border-gray-100 bg-white shadow-card",
        !embedded && (collapsed ? "w-[52px]" : "w-[280px]"),
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2.5">
        {!collapsed ? (
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate">Боковая панель</p>
        ) : null}
        <button
          type="button"
          onClick={toggle}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Развернуть панель" : "Свернуть панель"}
          className="blog-interactive-target ml-auto flex items-center justify-center rounded-full text-slate transition-colors hover:bg-sky/10 hover:text-sky focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40"
        >
          {collapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </div>

      {!collapsed ? (
        <div className="scrollbar-thin flex-1 touch-pan-y overflow-y-auto overscroll-y-contain px-4 py-4">
          <section>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate">Свежее</h2>
              {hasHubScope ? (
                <label className="blog-touch-target inline-flex cursor-pointer items-center gap-1.5 text-[11px] text-charcoal">
                  <input
                    type="checkbox"
                    checked={hubScope}
                    onChange={(event) => setHubScope(event.target.checked)}
                    className="h-3.5 w-3.5 rounded border-gray-300 text-sky focus:ring-sky/30"
                  />
                  Из «{hubLabel}»
                </label>
              ) : null}
            </div>
            {hubScope && hubHref ? (
              <Link href={hubHref} className="mt-1 inline-block text-[11px] font-medium text-sky hover:underline">
                Все материалы раздела →
              </Link>
            ) : null}
            <div className="mt-3 space-y-1">
              {displayedFreshPosts.map((post) => (
                <BlogCard key={post.id} post={post} variant="compact" />
              ))}
            </div>
          </section>

          <section className="mt-6 border-t border-gray-100 pt-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate">Автор</h2>
            <div className="mt-3 rounded-2xl border border-sky/10 bg-gradient-to-br from-sky/[0.06] to-white p-4">
              <p className="text-sm font-semibold text-charcoal">{BLOG_EDITORIAL.name}</p>
              <p className="mt-2 text-xs leading-relaxed text-slate">{BLOG_EDITORIAL.bio}</p>
            </div>
          </section>

          <section className="mt-6 border-t border-gray-100 pt-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate">Разделы сайта</h2>
            <ul className="mt-3 space-y-2">
              {BLOG_HUB_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="blog-touch-target flex flex-col justify-center rounded-xl border border-gray-100 px-3 transition-colors hover:border-sky/25 hover:bg-sky/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40"
                  >
                    <span className="text-sm font-medium text-charcoal">
                      {hubLinkIcon(link.type)} {link.label}
                    </span>
                    {link.description ? (
                      <span className="mt-0.5 block text-xs text-slate">{link.description}</span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-6 border-t border-gray-100 pt-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate">Контакты</h2>
            <ul className="mt-3 space-y-2 text-xs text-slate">
              {SITE_PHONES.map((phone) => (
                <li key={phone.tel}>
                  <a href={phone.tel} className="font-medium text-charcoal hover:text-sky">
                    {phone.display}
                  </a>
                  <span className="text-slate"> · {phone.label}</span>
                </li>
              ))}
              <li className="flex items-start gap-2">
                <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                <a href={SITE_EMAIL.href} className="hover:text-sky">
                  {SITE_EMAIL.display}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                <span>{SITE_OFFICE.display}</span>
              </li>
            </ul>
            <Link
              href="/contacts"
              className="blog-touch-target mt-3 inline-flex items-center text-xs font-medium text-sky hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40"
            >
              Все контакты →
            </Link>
          </section>
        </div>
      ) : null}
    </aside>
  );
}
