"use client";

import { useMemo, useState } from "react";
import { Layers, Plus } from "lucide-react";
import RichTextEditor from "@/components/editor/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import PageBuilderBlockCard from "@/components/admin/page-builder/PageBuilderBlockCard";
import PageBuilderBlockPicker from "@/components/admin/page-builder/PageBuilderBlockPicker";
import CmsMediaPickerDialog from "@/components/admin/CmsMediaPickerDialog";
import {
  createPageBuilderBlock,
  PAGE_BUILDER_BLOCK_BY_SLUG,
  type PageBuilderBlockSlug,
} from "@/lib/cms/page-builder/block-registry";
import {
  CMS_SECTION_HTML_MAX,
  normalizeCmsSectionBody,
  paragraphsLinesToInitialHtml,
} from "@/lib/content-section-body";
import type { BlogBodyBlock, BlogSectionKind } from "@/types/blog-content-blocks";
import type { ContentSection } from "@/types/content-page";

type Props = {
  sections: ContentSection[];
  onChange: (sections: ContentSection[]) => void;
};

function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function listToLines(items?: string[]): string {
  return items?.join("\n") ?? "";
}

function linesToList(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export default function GuideSectionPageBuilder({ sections, onChange }: Props) {
  const [pickerSectionIndex, setPickerSectionIndex] = useState<number | null>(null);
  const [mediaTarget, setMediaTarget] = useState<{
    sectionIndex: number;
    blockIndex: number;
  } | null>(null);

  function updateSection(index: number, patch: Partial<ContentSection>) {
    onChange(sections.map((section, i) => (i === index ? { ...section, ...patch } : section)));
  }

  function updateBlock(sectionIndex: number, blockIndex: number, block: BlogBodyBlock) {
    const section = sections[sectionIndex];
    const blocks = [...(section.blocks ?? [])];
    blocks[blockIndex] = block;
    updateSection(sectionIndex, { blocks });
  }

  function addBlock(sectionIndex: number, slug: PageBuilderBlockSlug) {
    const section = sections[sectionIndex];
    const block = createPageBuilderBlock(slug);
    const blocks = [...(section.blocks ?? []), block];
    const patch: Partial<ContentSection> = { blocks };
    const suggested = PAGE_BUILDER_BLOCK_BY_SLUG[slug].suggestedSectionKind;
    if (suggested && !section.blockType) {
      patch.blockType = suggested;
    }
    updateSection(sectionIndex, patch);
  }

  function removeBlock(sectionIndex: number, blockIndex: number) {
    const section = sections[sectionIndex];
    const blocks = (section.blocks ?? []).filter((_, i) => i !== blockIndex);
    updateSection(sectionIndex, { blocks: blocks.length ? blocks : undefined });
  }

  function addSection() {
    onChange([...sections, { heading: "Новый раздел", blocks: [] }]);
  }

  function removeSection(index: number) {
    onChange(sections.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-sky" aria-hidden />
          <h2 className="font-heading text-lg font-bold text-charcoal">Конструктор разделов</h2>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={addSection}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          Раздел
        </Button>
      </div>

      {sections.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-slate">
          Добавьте раздел и соберите материал из блоков — как в конструкторе блога.
        </p>
      ) : null}

      {sections.map((section, sectionIndex) => (
        <GuideSectionCard
          key={sectionIndex}
          section={section}
          sectionIndex={sectionIndex}
          onUpdate={(patch) => updateSection(sectionIndex, patch)}
          onRemove={() => removeSection(sectionIndex)}
          onUpdateBlock={(blockIndex, block) => updateBlock(sectionIndex, blockIndex, block)}
          onRemoveBlock={(blockIndex) => removeBlock(sectionIndex, blockIndex)}
          onMoveBlock={(blockIndex, direction) =>
            updateSection(sectionIndex, {
              blocks: moveItem(
                section.blocks ?? [],
                blockIndex,
                blockIndex + (direction === "up" ? -1 : 1)
              ),
            })
          }
          onPickMedia={(blockIndex) => setMediaTarget({ sectionIndex, blockIndex })}
          onOpenPicker={() => setPickerSectionIndex(sectionIndex)}
        />
      ))}

      <PageBuilderBlockPicker
        open={pickerSectionIndex !== null}
        onClose={() => setPickerSectionIndex(null)}
        onSelect={(slug) => {
          if (pickerSectionIndex !== null) addBlock(pickerSectionIndex, slug);
        }}
      />

      <CmsMediaPickerDialog
        open={mediaTarget !== null}
        onClose={() => setMediaTarget(null)}
        onSelect={(src) => {
          if (!mediaTarget) return;
          const block = sections[mediaTarget.sectionIndex]?.blocks?.[mediaTarget.blockIndex];
          if (block?.type === "media") {
            updateBlock(mediaTarget.sectionIndex, mediaTarget.blockIndex, {
              ...block,
              src,
            });
          }
        }}
      />
    </div>
  );
}

type GuideSectionCardProps = {
  section: ContentSection;
  sectionIndex: number;
  onUpdate: (patch: Partial<ContentSection>) => void;
  onRemove: () => void;
  onUpdateBlock: (blockIndex: number, block: BlogBodyBlock) => void;
  onRemoveBlock: (blockIndex: number) => void;
  onMoveBlock: (blockIndex: number, direction: "up" | "down") => void;
  onPickMedia: (blockIndex: number) => void;
  onOpenPicker: () => void;
};

function GuideSectionCard({
  section,
  sectionIndex,
  onUpdate,
  onRemove,
  onUpdateBlock,
  onRemoveBlock,
  onMoveBlock,
  onPickMedia,
  onOpenPicker,
}: GuideSectionCardProps) {
  const editorValue = useMemo(() => {
    if (section.html?.trim()) return section.html;
    return paragraphsLinesToInitialHtml(section.paragraphs);
  }, [section.html, section.paragraphs]);

  function handleLegacyHtmlChange(html: string) {
    onUpdate(normalizeCmsSectionBody({ ...section, html }));
  }

  return (
    <div className="space-y-3 rounded-2xl border border-gray-200 bg-surface-muted/20 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={section.heading ?? ""}
          onChange={(e) => onUpdate({ heading: e.target.value })}
          placeholder="Заголовок раздела (H2)"
          className="min-w-[200px] flex-1"
        />
        <NativeSelect
          value={section.blockType ?? "default"}
          onChange={(e) => onUpdate({ blockType: e.target.value as BlogSectionKind })}
          className="w-40"
          aria-label="Тип раздела"
        >
          <option value="default">Обычный</option>
          <option value="faq">FAQ</option>
          <option value="checklist">Чек-лист</option>
          <option value="mistakes">Ошибки</option>
        </NativeSelect>
        <Button type="button" size="sm" variant="ghost" onClick={onRemove}>
          Удалить раздел
        </Button>
      </div>

      <div className="space-y-2">
        {(section.blocks ?? []).length === 0 ? (
          <p className="text-xs text-slate">Блоков пока нет — добавьте первый.</p>
        ) : null}
        {(section.blocks ?? []).map((block, blockIndex) => (
          <PageBuilderBlockCard
            key={`${sectionIndex}-${blockIndex}-${block.type}`}
            block={block}
            index={blockIndex}
            total={section.blocks?.length ?? 0}
            onChange={(next) => onUpdateBlock(blockIndex, next)}
            onRemove={() => onRemoveBlock(blockIndex)}
            onMoveUp={() => onMoveBlock(blockIndex, "up")}
            onMoveDown={() => onMoveBlock(blockIndex, "down")}
            onPickMedia={() => onPickMedia(blockIndex)}
          />
        ))}
      </div>

      <Button type="button" size="sm" variant="outline" onClick={onOpenPicker}>
        <Plus className="mr-1 h-3.5 w-3.5" />
        Добавить блок
      </Button>

      <details className="rounded-xl border border-gray-100 bg-white px-3 py-2 text-xs">
        <summary className="cursor-pointer text-slate">
          Legacy: rich-text и маркированный список
        </summary>
        <div className="mt-2 space-y-3">
          <RichTextEditor
            value={editorValue}
            onChange={handleLegacyHtmlChange}
            maxLength={CMS_SECTION_HTML_MAX}
            minHeight={120}
            toolbar="full"
            placeholder="Абзацы, списки, ссылки — если блоков недостаточно"
          />
          <label className="block space-y-1 text-slate">
            Маркированный список (по одному пункту на строку)
            <textarea
              className="min-h-[60px] w-full rounded-lg border border-gray-200 px-2 py-1 text-sm text-charcoal"
              value={listToLines(section.list)}
              onChange={(e) => onUpdate({ list: linesToList(e.target.value) })}
            />
          </label>
        </div>
      </details>
    </div>
  );
}
