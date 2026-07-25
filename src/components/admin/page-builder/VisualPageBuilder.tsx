"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Layers, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import DesignLibraryPatternCard from "@/components/admin/page-builder/DesignLibraryPatternCard";
import PageBuilderBlockPicker from "@/components/admin/page-builder/PageBuilderBlockPicker";
import SortableBlockList from "@/components/admin/page-builder/SortableBlockList";
import CmsMediaPickerDialog from "@/components/admin/CmsMediaPickerDialog";
import {
  createPageBuilderBlock,
  PAGE_BUILDER_BLOCK_BY_SLUG,
  type PageBuilderBlockSlug,
} from "@/lib/cms/page-builder/block-registry";
import {
  createPageBuilderPattern,
  PAGE_BUILDER_PATTERNS,
  type PageBuilderPatternSlug,
} from "@/lib/cms/page-builder/pattern-registry";
import type { BlogBodyBlock, BlogSectionKind } from "@/types/blog-content-blocks";

export type VisualPageBuilderSection = {
  id: string;
  title: string;
  blockType?: BlogSectionKind;
  blocks?: BlogBodyBlock[];
  legacyBody?: string;
};

type Props = {
  sections: VisualPageBuilderSection[];
  onChange: (sections: VisualPageBuilderSection[]) => void;
  title?: string;
  showLegacyBody?: boolean;
  legacyBodyLabel?: string;
  /** Quick-start templates shown when the document has no sections yet. */
  starterPatterns?: PageBuilderPatternSlug[];
  helpText?: string;
};

function newSection(title = "Новый раздел"): VisualPageBuilderSection {
  return {
    id: crypto.randomUUID(),
    title,
    blocks: [],
  };
}

type MediaKind = "media" | "gallery" | "image-text" | "author-card" | "photo" | "hero-banner";

export default function VisualPageBuilder({
  sections,
  onChange,
  title = "Визуальный конструктор",
  showLegacyBody = false,
  legacyBodyLabel = "Legacy: текстовое тело",
  starterPatterns = ["practical-guide", "destination-story", "hub-intro"],
  helpText = "Перетаскивайте блоки за ручку слева. Через «+» можно добавить отдельный блок или готовую секцию из библиотеки — без кода. Разделы перемещайте стрелками.",
}: Props) {
  const [pickerSectionIndex, setPickerSectionIndex] = useState<number | null>(null);
  const [mediaTarget, setMediaTarget] = useState<{
    sectionIndex: number;
    blockIndex: number;
    kind: MediaKind;
  } | null>(null);

  function updateSection(index: number, patch: Partial<VisualPageBuilderSection>) {
    onChange(sections.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function moveSection(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= sections.length) return;
    const next = [...sections];
    const [item] = next.splice(index, 1);
    next.splice(nextIndex, 0, item);
    onChange(next);
  }

  function addBlock(sectionIndex: number, slug: PageBuilderBlockSlug) {
    const section = sections[sectionIndex];
    const block = createPageBuilderBlock(slug);
    const blocks = [...(section.blocks ?? []), block];
    const patch: Partial<VisualPageBuilderSection> = { blocks };
    const suggested = PAGE_BUILDER_BLOCK_BY_SLUG[slug]?.suggestedSectionKind;
    if (suggested && !section.blockType) {
      patch.blockType = suggested;
    }
    updateSection(sectionIndex, patch);
  }

  function addPattern(sectionIndex: number, patternBlocks: BlogBodyBlock[]) {
    const section = sections[sectionIndex];
    const blocks = [...(section.blocks ?? []), ...patternBlocks];
    const suggested = patternBlocks
      .map((block) => PAGE_BUILDER_BLOCK_BY_SLUG[block.type]?.suggestedSectionKind)
      .find(Boolean);
    updateSection(sectionIndex, {
      blocks,
      ...(!section.blockType && suggested ? { blockType: suggested } : {}),
    });
  }

  function startFromPattern(slug: PageBuilderPatternSlug) {
    const pattern = PAGE_BUILDER_PATTERNS.find((item) => item.slug === slug);
    const blocks = createPageBuilderPattern(slug);
    onChange([
      {
        ...newSection(pattern?.label ?? "Основной раздел"),
        blocks,
      },
    ]);
  }

  function mediaKindForBlock(block: BlogBodyBlock | undefined): MediaKind {
    if (block?.type === "gallery") return "gallery";
    if (block?.type === "image-text") return "image-text";
    if (block?.type === "author-card") return "author-card";
    if (block?.type === "photo") return "photo";
    if (block?.type === "hero-banner") return "hero-banner";
    return "media";
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-sky" aria-hidden />
          <h2 className="font-heading text-lg font-bold text-charcoal">{title}</h2>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={() => onChange([...sections, newSection()])}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          Раздел
        </Button>
      </div>

      <p className="text-xs text-slate">{helpText}</p>

      {sections.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gradient-to-b from-sky/[0.06] to-white px-4 py-6">
          <div className="text-center">
            <p className="font-heading text-base font-bold text-charcoal">Библиотека шаблонов</p>
            <p className="mt-1 text-sm text-slate">
              Выберите готовый состав секции — дальше можно править каждый блок.
            </p>
          </div>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {starterPatterns.map((slug) => {
              const pattern = PAGE_BUILDER_PATTERNS.find((item) => item.slug === slug);
              if (!pattern) return null;
              return (
                <li key={slug}>
                  <DesignLibraryPatternCard
                    pattern={pattern}
                    size="large"
                    onSelect={() => startFromPattern(slug)}
                  />
                </li>
              );
            })}
          </ul>
          <div className="mt-4 flex justify-center">
            <Button type="button" size="sm" variant="outline" onClick={() => onChange([newSection("Основной раздел")])}>
              Пустой раздел
            </Button>
          </div>
        </div>
      ) : null}

      {sections.map((section, sectionIndex) => (
        <div
          key={section.id}
          className="space-y-3 rounded-2xl border border-gray-200 bg-surface-muted/20 p-4"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={section.title}
              onChange={(e) => updateSection(sectionIndex, { title: e.target.value })}
              placeholder="Заголовок раздела (H2)"
              className="min-w-[200px] flex-1"
            />
            <NativeSelect
              value={section.blockType ?? "default"}
              onChange={(e) =>
                updateSection(sectionIndex, {
                  blockType: e.target.value as BlogSectionKind,
                })
              }
              className="w-40"
              aria-label="Тип раздела"
            >
              <option value="default">Обычный</option>
              <option value="faq">FAQ</option>
              <option value="checklist">Чек-лист</option>
              <option value="mistakes">Ошибки</option>
              <option value="tips">Советы</option>
            </NativeSelect>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              aria-label="Переместить раздел вверх"
              disabled={sectionIndex === 0}
              onClick={() => moveSection(sectionIndex, -1)}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              aria-label="Переместить раздел вниз"
              disabled={sectionIndex === sections.length - 1}
              onClick={() => moveSection(sectionIndex, 1)}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => onChange(sections.filter((_, i) => i !== sectionIndex))}
            >
              Удалить раздел
            </Button>
          </div>

          {(section.blocks ?? []).length === 0 ? (
            <p className="text-xs text-slate">Блоков пока нет — добавьте первый.</p>
          ) : (
            <SortableBlockList
              blocks={section.blocks ?? []}
              onChange={(blocks) => updateSection(sectionIndex, { blocks })}
              onPickMedia={(blockIndex) => {
                const block = section.blocks?.[blockIndex];
                setMediaTarget({
                  sectionIndex,
                  blockIndex,
                  kind: mediaKindForBlock(block),
                });
              }}
            />
          )}

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setPickerSectionIndex(sectionIndex)}
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Добавить блок
          </Button>

          {showLegacyBody ? (
            <details className="rounded-xl border border-gray-100 bg-white px-3 py-2 text-xs">
              <summary className="cursor-pointer text-slate">{legacyBodyLabel}</summary>
              <textarea
                className="mt-2 min-h-[80px] w-full rounded-lg border border-gray-200 px-2 py-1 text-sm text-charcoal"
                value={section.legacyBody ?? ""}
                onChange={(e) => updateSection(sectionIndex, { legacyBody: e.target.value })}
              />
            </details>
          ) : null}
        </div>
      ))}

      <PageBuilderBlockPicker
        open={pickerSectionIndex !== null}
        onClose={() => setPickerSectionIndex(null)}
        onSelect={(slug) => {
          if (pickerSectionIndex !== null) addBlock(pickerSectionIndex, slug);
        }}
        onSelectPattern={(blocks) => {
          if (pickerSectionIndex !== null) addPattern(pickerSectionIndex, blocks);
        }}
      />

      <CmsMediaPickerDialog
        open={mediaTarget !== null}
        onClose={() => setMediaTarget(null)}
        onSelect={(src) => {
          if (!mediaTarget) return;
          const section = sections[mediaTarget.sectionIndex];
          const block = section?.blocks?.[mediaTarget.blockIndex];
          if (!block) return;

          if (block.type === "media" || block.type === "photo") {
            const blocks = [...(section.blocks ?? [])];
            blocks[mediaTarget.blockIndex] = { ...block, src };
            updateSection(mediaTarget.sectionIndex, { blocks });
          } else if (block.type === "hero-banner") {
            const blocks = [...(section.blocks ?? [])];
            blocks[mediaTarget.blockIndex] = { ...block, imageSrc: src };
            updateSection(mediaTarget.sectionIndex, { blocks });
          } else if (block.type === "gallery") {
            const items = [...block.items];
            const emptyIndex = items.findIndex((item) => !item.src.trim());
            if (emptyIndex >= 0) {
              items[emptyIndex] = { ...items[emptyIndex], src };
            } else {
              items.push({ src, alt: "" });
            }
            const blocks = [...(section.blocks ?? [])];
            blocks[mediaTarget.blockIndex] = { ...block, items };
            updateSection(mediaTarget.sectionIndex, { blocks });
          } else if (block.type === "image-text") {
            const blocks = [...(section.blocks ?? [])];
            blocks[mediaTarget.blockIndex] = { ...block, src };
            updateSection(mediaTarget.sectionIndex, { blocks });
          } else if (block.type === "author-card") {
            const blocks = [...(section.blocks ?? [])];
            blocks[mediaTarget.blockIndex] = { ...block, avatarSrc: src };
            updateSection(mediaTarget.sectionIndex, { blocks });
          }
        }}
      />
    </div>
  );
}
