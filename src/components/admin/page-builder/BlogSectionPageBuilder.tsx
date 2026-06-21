"use client";

import { useState } from "react";
import { Layers, Plus } from "lucide-react";
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
import type { BlogBodyBlock, BlogSectionKind } from "@/types/blog-content-blocks";
import type { BlogPostSection } from "@/types";

type Props = {
  sections: BlogPostSection[];
  onChange: (sections: BlogPostSection[]) => void;
};

function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export default function BlogSectionPageBuilder({ sections, onChange }: Props) {
  const [pickerSectionIndex, setPickerSectionIndex] = useState<number | null>(null);
  const [mediaTarget, setMediaTarget] = useState<{
    sectionIndex: number;
    blockIndex: number;
  } | null>(null);

  function updateSection(index: number, patch: Partial<BlogPostSection>) {
    onChange(sections.map((s, i) => (i === index ? { ...s, ...patch } : s)));
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
    const patch: Partial<BlogPostSection> = { blocks };
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
    onChange([...sections, { title: "Новый раздел", body: "", blocks: [] }]);
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
          Добавьте раздел и соберите статью из блоков — как в Payload layout builder.
        </p>
      ) : null}

      {sections.map((section, sectionIndex) => (
        <div
          key={sectionIndex}
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
            </NativeSelect>
            <Button type="button" size="sm" variant="ghost" onClick={() => removeSection(sectionIndex)}>
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
                onChange={(next) => updateBlock(sectionIndex, blockIndex, next)}
                onRemove={() => removeBlock(sectionIndex, blockIndex)}
                onMoveUp={() =>
                  updateSection(sectionIndex, {
                    blocks: moveItem(section.blocks ?? [], blockIndex, blockIndex - 1),
                  })
                }
                onMoveDown={() =>
                  updateSection(sectionIndex, {
                    blocks: moveItem(section.blocks ?? [], blockIndex, blockIndex + 1),
                  })
                }
                onPickMedia={() => setMediaTarget({ sectionIndex, blockIndex })}
              />
            ))}
          </div>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setPickerSectionIndex(sectionIndex)}
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Добавить блок
          </Button>

          <details className="rounded-xl border border-gray-100 bg-white px-3 py-2 text-xs">
            <summary className="cursor-pointer text-slate">Legacy: текстовое тело (markdown)</summary>
            <textarea
              className="mt-2 min-h-[80px] w-full rounded-lg border border-gray-200 px-2 py-1 text-sm text-charcoal"
              value={section.body}
              onChange={(e) => updateSection(sectionIndex, { body: e.target.value })}
              placeholder="Опционально — парсится если блоков мало"
            />
          </details>
        </div>
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
