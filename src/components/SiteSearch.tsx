"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Compass,
  FileText,
  Globe,
  HelpCircle,
  Landmark,
  MapPin,
  Plane,
  Search,
  Stamp,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAdaptiveFloatingTone } from "@/hooks/useAdaptiveFloatingTone";
import { floatingChromeButtonClass, floatingChromeInsetClass } from "@/lib/floating-chrome-button";
import { cn } from "@/lib/cn";
import { SITE_SEARCH_OPEN_EVENT } from "@/lib/site-search-open";
import { searchSiteIndex, type SearchResultGroup } from "@/lib/site-search";
import { getDefaultSearchIndex, loadSearchIndex } from "@/lib/site-search-client";
import type { SearchIndexItem, SearchResultType } from "@/lib/site-search-index";
import { TOURS_REPOSITORY_UPDATED_EVENT } from "@/types/tour";

const TYPE_ICONS: Record<SearchResultType, typeof Search> = {
  tour: Plane,
  excursion: Landmark,
  blog: BookOpen,
  faq: HelpCircle,
  page: Compass,
  legal: FileText,
  destination: MapPin,
  guide: Globe,
  immigration: Stamp,
};

export default function SiteSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [indexVersion, setIndexVersion] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const tone = useAdaptiveFloatingTone(buttonRef);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
    }

    function onOpenRequest() {
      setOpen(true);
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener(SITE_SEARCH_OPEN_EVENT, onOpenRequest);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(SITE_SEARCH_OPEN_EVENT, onOpenRequest);
    };
  }, []);

  useEffect(() => {
    function refreshIndex() {
      setIndexVersion((value) => value + 1);
    }

    window.addEventListener(TOURS_REPOSITORY_UPDATED_EVENT, refreshIndex);
    return () => window.removeEventListener(TOURS_REPOSITORY_UPDATED_EVENT, refreshIndex);
  }, []);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(timer);
  }, [open]);

  const [searchIndex, setSearchIndex] = useState<SearchIndexItem[]>(() => getDefaultSearchIndex());

  useEffect(() => {
    let cancelled = false;

    void loadSearchIndex().then((index) => {
      if (!cancelled) setSearchIndex(index);
    });

    return () => {
      cancelled = true;
    };
  }, [indexVersion]);

  const results: SearchResultGroup[] = useMemo(
    () => searchSiteIndex(searchIndex, query),
    [searchIndex, query]
  );

  const handleOpenChange = useCallback((next: boolean) => {
    setOpen(next);
    if (!next) setQuery("");
  }, []);

  function handleSelect(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  const hasQuery = query.trim().length > 0;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(true)}
        data-no-custom-cursor
        data-floating-chrome="true"
        className={floatingChromeButtonClass(
          tone === "dark",
          cn(floatingChromeInsetClass, "fixed bottom-20 z-[90] hidden sm:bottom-6 sm:flex")
        )}
        aria-label="Поиск по сайту"
      >
        <Search className="h-4 w-4" strokeWidth={2} />
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          bottomSheet={false}
          showClose
          className="max-w-2xl overflow-hidden p-0 sm:max-w-2xl"
        >
          <DialogTitle className="sr-only">Поиск по сайту</DialogTitle>
          <DialogDescription className="sr-only">
            Ищите туры, статьи, FAQ, страницы и направления по всему сайту
          </DialogDescription>

          <div className="border-b border-border-subtle px-4 py-3 pr-12 sm:px-5 sm:pr-14">
            <div className="flex items-center gap-3">
              <Search className="h-5 w-5 shrink-0 text-sky" strokeWidth={1.75} />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Туры, статьи, FAQ, направления…"
                className="min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted"
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            <p className="mt-2 text-xs text-muted">
              <kbd className="rounded border border-border-subtle px-1">⌘</kbd>
              {" + "}
              <kbd className="rounded border border-border-subtle px-1">K</kbd>
              {" "}— открыть · Esc — закрыть
            </p>
          </div>

          <div className="max-h-[min(60vh,28rem)] overflow-y-auto px-2 py-2 sm:px-3">
            {!hasQuery ? (
              <div className="px-3 py-8 text-center text-sm text-muted">
                Начните вводить запрос — туры, блог, FAQ, документы и направления
              </div>
            ) : results.length === 0 ? (
              <div className="px-3 py-8 text-center text-sm text-muted">
                Ничего не найдено по запросу «{query.trim()}»
              </div>
            ) : (
              <div className="space-y-4 pb-2">
                {results.map((group) => {
                  const Icon = TYPE_ICONS[group.type];
                  return (
                    <section key={group.type}>
                      <h3 className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
                        {group.label}
                      </h3>
                      <ul className="space-y-0.5">
                        {group.items.map((item) => (
                          <li key={item.id}>
                            <button
                              type="button"
                              onClick={() => handleSelect(item.href)}
                              className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-sky/8"
                            >
                              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky/10 text-sky">
                                <Icon className="h-4 w-4" strokeWidth={1.75} />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-medium text-foreground">
                                  {item.title}
                                </span>
                                {item.description ? (
                                  <span className="mt-0.5 line-clamp-2 text-xs text-muted">
                                    {item.description}
                                  </span>
                                ) : null}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </section>
                  );
                })}
              </div>
            )}
          </div>

          {hasQuery && results.length > 0 ? (
            <div className="border-t border-border-subtle px-4 py-2.5 text-center text-xs text-muted sm:px-5">
              <Link
                href={`/tours?query=${encodeURIComponent(query.trim())}`}
                onClick={() => handleOpenChange(false)}
                className="font-medium text-sky hover:underline"
              >
                Показать туры в каталоге →
              </Link>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
