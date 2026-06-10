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
  className?: string;
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

export default function BlogSidebar({ freshPosts, className }: BlogSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

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

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      writeCollapsed(next);
      return next;
    });
  }

  if (!hydrated) {
    return (
      <aside className={cn("hidden w-[280px] shrink-0 xl:block", className)}>
        <div className={cn("h-[420px] rounded-3xl border border-gray-100 bg-white shadow-card", hubTocStickyTopClass)} />
      </aside>
    );
  }

  return (
    <aside
      className={cn(
        "sticky hidden h-fit shrink-0 flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-card transition-[width] duration-300 ease-out xl:flex",
        hubTocStickyTopClass,
        hubTocStickyMaxHeightClass,
        collapsed ? "w-[52px]" : "w-[280px]",
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
          aria-label={collapsed ? "Развернуть панель" : "Свернуть панель"}
          className="ml-auto flex h-8 w-8 items-center justify-center rounded-full text-slate transition-colors hover:bg-sky/10 hover:text-sky"
        >
          {collapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </div>

      {!collapsed ? (
        <div className="scrollbar-thin flex-1 overflow-y-auto px-4 py-4">
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate">Свежее</h2>
            <div className="mt-3 space-y-1">
              {freshPosts.map((post) => (
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
                    className="block rounded-xl border border-gray-100 px-3 py-2.5 transition-colors hover:border-sky/25 hover:bg-sky/5"
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
              className="mt-3 inline-flex text-xs font-medium text-sky hover:underline"
            >
              Все контакты →
            </Link>
          </section>
        </div>
      ) : null}
    </aside>
  );
}
