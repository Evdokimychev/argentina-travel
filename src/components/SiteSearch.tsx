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
  Loader2,
  MapPin,
  Mountain,
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
import {
  SEARCH_DEBOUNCE_MS,
  fetchSiteSearch,
  type SearchHit,
  type SearchSource,
} from "@/lib/search/search-client";
import { getDefaultSearchIndex, loadSearchIndex } from "@/lib/site-search-client";
import {
  SEARCH_TYPE_LABELS,
  type SearchIndexItem,
  type SearchResultType,
} from "@/lib/site-search-index";
import { TOURS_REPOSITORY_UPDATED_EVENT } from "@/types/tour";

const TYPE_ICONS: Record<SearchResultType, typeof Search> = {
  tour: Plane,
  excursion: Landmark,
  place: Mountain,
  blog: BookOpen,
  faq: HelpCircle,
  page: Compass,
  legal: FileText,
  destination: MapPin,
  guide: Globe,
  immigration: Stamp,
};

const KIND_FILTERS: Array<{ kind: SearchResultType | "all"; label: string }> = [
  { kind: "all", label: "Все" },
  { kind: "tour", label: SEARCH_TYPE_LABELS.tour },
  { kind: "excursion", label: SEARCH_TYPE_LABELS.excursion },
  { kind: "place", label: SEARCH_TYPE_LABELS.place },
  { kind: "blog", label: SEARCH_TYPE_LABELS.blog },
  { kind: "guide", label: SEARCH_TYPE_LABELS.guide },
  { kind: "destination", label: SEARCH_TYPE_LABELS.destination },
];

type SearchResultItem = SearchIndexItem & {
  score: number;
  titleHighlight?: string;
  descriptionHighlight?: string;
};

function MarkHighlight({ text }: { text: string }) {
  const segments: Array<{ highlighted: boolean; text: string }> = [];
  const regex = /<mark>(.*?)<\/mark>/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ highlighted: false, text: text.slice(lastIndex, match.index) });
    }
    segments.push({ highlighted: true, text: match[1] });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({ highlighted: false, text: text.slice(lastIndex) });
  }

  if (segments.length === 0) {
    return <>{text.replace(/<\/?mark>/g, "")}</>;
  }

  return (
    <>
      {segments.map((segment, index) =>
        segment.highlighted ? (
          <mark
            key={index}
            className="rounded bg-sky/25 text-foreground not-italic"
          >
            {segment.text}
          </mark>
        ) : (
          <span key={index}>{segment.text}</span>
        )
      )}
    </>
  );
}

function groupHitsByKind(hits: SearchHit[]): SearchResultGroup[] {
  const groups = new Map<SearchResultType, SearchResultGroup & { items: SearchResultItem[] }>();

  for (const hit of hits) {
    const existing = groups.get(hit.kind);
    const item: SearchResultItem = {
      id: hit.id,
      type: hit.kind,
      title: hit.title,
      description: hit.description,
      titleHighlight: hit.titleHighlight,
      descriptionHighlight: hit.descriptionHighlight,
      href: hit.url,
      score: hit.score,
    };

    if (existing) {
      existing.items.push(item);
      continue;
    }

    groups.set(hit.kind, {
      type: hit.kind,
      label: hit.kindLabel,
      items: [item],
    });
  }

  const order: SearchResultType[] = [
    "tour",
    "excursion",
    "place",
    "blog",
    "guide",
    "destination",
    "immigration",
    "page",
    "faq",
    "legal",
  ];

  return order.filter((type) => groups.has(type)).map((type) => groups.get(type)!);
}

export default function SiteSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<SearchResultType | "all">("all");
  const [indexVersion, setIndexVersion] = useState(0);
  const [loading, setLoading] = useState(false);
  const [apiHits, setApiHits] = useState<SearchHit[] | null>(null);
  const [searchSource, setSearchSource] = useState<SearchSource | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const abortRef = useRef<AbortController | null>(null);
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

  const trimmedQuery = query.trim();
  const hasQuery = trimmedQuery.length > 0;

  useEffect(() => {
    if (!hasQuery) {
      abortRef.current?.abort();
      setApiHits(null);
      setSearchSource(null);
      setLoading(false);
      return;
    }

    const timer = window.setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);

      void fetchSiteSearch(trimmedQuery, {
        kind: kindFilter === "all" ? undefined : kindFilter,
        signal: controller.signal,
      })
        .then((payload) => {
          if (controller.signal.aborted) return;
          setApiHits(payload.results);
          setSearchSource(payload.source);
        })
        .catch(() => {
          if (controller.signal.aborted) return;
          setApiHits(null);
          setSearchSource("static");
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [trimmedQuery, kindFilter, hasQuery]);

  const fallbackResults: SearchResultGroup[] = useMemo(() => {
    if (!hasQuery) return [];
    const filtered =
      kindFilter === "all"
        ? searchIndex
        : searchIndex.filter((item) => item.type === kindFilter);
    return searchSiteIndex(filtered, trimmedQuery);
  }, [searchIndex, trimmedQuery, kindFilter, hasQuery]);

  const results: SearchResultGroup[] = useMemo(() => {
    if (!hasQuery) return [];
    if (apiHits !== null) return groupHitsByKind(apiHits);
    return fallbackResults;
  }, [apiHits, fallbackResults, hasQuery]);

  const flatItems = useMemo(() => {
    const items: SearchResultItem[] = [];
    for (const group of results) {
      for (const item of group.items) {
        items.push(item as SearchResultItem);
      }
    }
    return items;
  }, [results]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [trimmedQuery, kindFilter, flatItems.length]);

  useEffect(() => {
    if (activeIndex < 0) return;
    const node = itemRefs.current[activeIndex];
    node?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const handleOpenChange = useCallback((next: boolean) => {
    setOpen(next);
    if (!next) {
      setQuery("");
      setKindFilter("all");
      setApiHits(null);
      setSearchSource(null);
      setActiveIndex(-1);
    }
  }, []);

  function handleSelect(href: string) {
    setOpen(false);
    setQuery("");
    setKindFilter("all");
    setApiHits(null);
    setActiveIndex(-1);
    router.push(href);
  }

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (flatItems.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index < flatItems.length - 1 ? index + 1 : 0));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? flatItems.length - 1 : index - 1));
      return;
    }

    if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      handleSelect(flatItems[activeIndex].href);
    }
  }

  let flatItemIndex = 0;

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
                onKeyDown={handleInputKeyDown}
                placeholder="Туры, статьи, FAQ, направления…"
                className="min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted"
                autoComplete="off"
                spellCheck={false}
                role="combobox"
                aria-expanded={hasQuery && results.length > 0}
                aria-controls="site-search-results"
                aria-activedescendant={
                  activeIndex >= 0 ? `site-search-option-${activeIndex}` : undefined
                }
              />
              {loading ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted" aria-hidden />
              ) : null}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {KIND_FILTERS.map((filter) => (
                <button
                  key={filter.kind}
                  type="button"
                  onClick={() => setKindFilter(filter.kind)}
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
                    kindFilter === filter.kind
                      ? "bg-sky/15 text-sky"
                      : "bg-muted/10 text-muted hover:bg-muted/20 hover:text-foreground"
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">
              <kbd className="rounded border border-border-subtle px-1">⌘</kbd>
              {" + "}
              <kbd className="rounded border border-border-subtle px-1">K</kbd>
              {" "}— открыть · ↑↓ — навигация · Enter — открыть · Esc — закрыть
            </p>
          </div>

          <div
            id="site-search-results"
            className="max-h-[min(60vh,28rem)] overflow-y-auto px-2 py-2 sm:px-3"
            role="listbox"
          >
            {!hasQuery ? (
              <div className="px-3 py-8 text-center text-sm text-muted">
                Начните вводить запрос — туры, блог, FAQ, документы и направления
              </div>
            ) : loading && results.length === 0 ? (
              <div className="px-3 py-8 text-center text-sm text-muted">Ищем…</div>
            ) : results.length === 0 ? (
              <div className="px-3 py-8 text-center text-sm text-muted">
                Ничего не найдено по запросу «{trimmedQuery}»
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
                        {group.items.map((item) => {
                          const currentIndex = flatItemIndex;
                          flatItemIndex += 1;
                          const isActive = currentIndex === activeIndex;
                          const resultItem = item as SearchResultItem;

                          return (
                          <li key={item.id} role="option" aria-selected={isActive}>
                            <button
                              ref={(node) => {
                                itemRefs.current[currentIndex] = node;
                              }}
                              id={`site-search-option-${currentIndex}`}
                              type="button"
                              onClick={() => handleSelect(item.href)}
                              onMouseEnter={() => setActiveIndex(currentIndex)}
                              className={cn(
                                "flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                                isActive ? "bg-sky/12" : "hover:bg-sky/8"
                              )}
                            >
                              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky/10 text-sky">
                                <Icon className="h-4 w-4" strokeWidth={1.75} />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="flex items-center gap-2">
                                  <span className="block truncate text-sm font-medium text-foreground">
                                    {resultItem.titleHighlight ? (
                                      <MarkHighlight text={resultItem.titleHighlight} />
                                    ) : (
                                      item.title
                                    )}
                                  </span>
                                  <span className="shrink-0 rounded-full bg-muted/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">
                                    {group.label}
                                  </span>
                                </span>
                                {resultItem.descriptionHighlight || item.description ? (
                                  <span className="mt-0.5 line-clamp-2 text-xs text-muted">
                                    {resultItem.descriptionHighlight ? (
                                      <MarkHighlight text={resultItem.descriptionHighlight} />
                                    ) : (
                                      item.description
                                    )}
                                  </span>
                                ) : null}
                              </span>
                            </button>
                          </li>
                          );
                        })}
                      </ul>
                    </section>
                  );
                })}
              </div>
            )}
          </div>

          {hasQuery && results.length > 0 ? (
            <div className="border-t border-border-subtle px-4 py-2.5 text-center text-xs text-muted sm:px-5">
              {searchSource === "static" ? (
                <span className="mr-2 text-muted">Локальный индекс</span>
              ) : null}
              <Link
                href={`/tours?query=${encodeURIComponent(trimmedQuery)}`}
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
