"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  PAGE_BUILDER_BLOCKS,
  PAGE_BUILDER_BLOCK_GROUPS,
  type PageBuilderBlockGroup,
  type PageBuilderBlockSlug,
} from "@/lib/cms/page-builder/block-registry";
import {
  matchesPageBuilderPattern,
  PAGE_BUILDER_PATTERNS,
} from "@/lib/cms/page-builder/pattern-registry";
import type { BlogBodyBlock } from "@/types/blog-content-blocks";

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (slug: PageBuilderBlockSlug) => void;
  onSelectPattern?: (blocks: BlogBodyBlock[]) => void;
};

export default function PageBuilderBlockPicker({ open, onClose, onSelect, onSelectPattern }: Props) {
  const [query, setQuery] = useState("");
  const groups = Object.keys(PAGE_BUILDER_BLOCK_GROUPS) as PageBuilderBlockGroup[];

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const normalizedQuery = query.trim().toLocaleLowerCase("ru");
  const visibleBlocks = useMemo(
    () => normalizedQuery
      ? PAGE_BUILDER_BLOCKS.filter((block) => {
          const group = PAGE_BUILDER_BLOCK_GROUPS[block.group];
          return [block.label, block.description, group.label, group.description]
            .join(" ")
            .toLocaleLowerCase("ru")
            .includes(normalizedQuery);
        })
      : PAGE_BUILDER_BLOCKS,
    [normalizedQuery],
  );
  const visiblePatterns = useMemo(
    () => normalizedQuery
      ? PAGE_BUILDER_PATTERNS.filter((pattern) => matchesPageBuilderPattern(pattern, normalizedQuery))
      : PAGE_BUILDER_PATTERNS,
    [normalizedQuery],
  );
  const resultCount = visibleBlocks.length + (onSelectPattern ? visiblePatterns.length : 0);

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Добавить готовый блок</DialogTitle>
          <DialogDescription>
            Выберите повторяемую секцию. Содержимое можно изменить после добавления.
          </DialogDescription>
        </DialogHeader>
        <div className="sticky top-0 z-10 border-b border-border-subtle bg-surface-elevated px-5 py-3 sm:px-6">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
            <Input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Найти: галерея, автор, маршрут…"
              aria-label="Поиск по библиотеке блоков"
              className="pl-10"
            />
          </div>
          <p className="mt-2 text-xs text-muted" role="status">
            {resultCount} {resultCount === 1 ? "вариант" : "вариантов"}
          </p>
        </div>
        <DialogBody className="flex-1 overflow-y-auto py-5">
          {resultCount ? <>
          {onSelectPattern && visiblePatterns.length ? (
            <section className="mb-7" aria-labelledby="builder-patterns-title">
              <h3 id="builder-patterns-title" className="text-xs font-bold uppercase tracking-[0.12em] text-muted">
                Готовые секции
              </h3>
              <p className="mb-3 mt-1 text-xs text-muted">Несколько согласованных блоков добавятся одним действием.</p>
              <ul className="grid gap-2 sm:grid-cols-2">
                {visiblePatterns.map((pattern) => {
                  const Icon = pattern.icon;
                  return (
                    <li key={pattern.slug}>
                      <button type="button" className="group flex h-full w-full items-start gap-3 rounded-card border border-sky/20 bg-sky/[0.045] px-3 py-3 text-left transition hover:border-sky/40 hover:bg-sky/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/35"
                        onClick={() => { onSelectPattern(pattern.create()); onClose(); }}>
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-ink text-white"><Icon className="h-4 w-4" aria-hidden /></span>
                        <span><span className="block text-sm font-semibold text-foreground">{pattern.label}</span><span className="mt-0.5 block text-xs leading-relaxed text-muted">{pattern.description}</span></span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}
          {visibleBlocks.length ? groups.map((group) => {
            const meta = PAGE_BUILDER_BLOCK_GROUPS[group];
            const blocks = visibleBlocks.filter((block) => block.group === group);
            if (!blocks.length) return null;

            return (
              <section key={group} className="mb-6 last:mb-0" aria-labelledby={`builder-group-${group}`}>
                <h3 id={`builder-group-${group}`} className="text-xs font-bold uppercase tracking-[0.12em] text-muted">
                  {meta.label}
                </h3>
                <p className="mb-2 mt-1 text-xs text-muted">{meta.description}</p>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {blocks.map((block) => {
                    const Icon = block.icon;
                    return (
                      <li key={block.slug}>
                        <button
                          type="button"
                          className="group flex h-full w-full items-start gap-3 rounded-card border border-border-subtle bg-surface-elevated px-3 py-3 text-left transition hover:border-sky/35 hover:bg-sky/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/35"
                          onClick={() => { onSelect(block.slug); onClose(); }}
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky/10 text-sky-ink transition group-hover:bg-sky-ink group-hover:text-white">
                            <Icon className="h-4 w-4" aria-hidden />
                          </span>
                          <span>
                            <span className="block text-sm font-semibold text-foreground">{block.label}</span>
                            <span className="mt-0.5 block text-xs leading-relaxed text-muted">{block.description}</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          }) : null}
          </> : (
            <div className="rounded-card border border-dashed border-border-subtle bg-surface-muted/50 px-5 py-8 text-center">
              <p className="text-sm font-semibold text-foreground">Таких блоков пока нет</p>
              <p className="mt-1 text-xs text-muted">Попробуйте другое слово или очистите поиск.</p>
            </div>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
