"use client";

import { useMemo } from "react";
import RichTextEditor from "@/components/editor/RichTextEditor";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  CMS_SECTION_HTML_MAX,
  normalizeCmsSectionBody,
  paragraphsLinesToInitialHtml,
} from "@/lib/content-section-body";
import type { ContentSection } from "@/types/content-page";

type Props = {
  section: ContentSection;
  index: number;
  onChange: (section: ContentSection) => void;
  onRemove: () => void;
};

function listToLines(items?: string[]): string {
  return items?.join("\n") ?? "";
}

function linesToList(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export default function CmsSectionEditor({ section, index, onChange, onRemove }: Props) {
  const editorValue = useMemo(() => {
    if (section.html?.trim()) return section.html;
    return paragraphsLinesToInitialHtml(section.paragraphs);
  }, [section.html, section.paragraphs]);

  function patch(patch: Partial<ContentSection>) {
    onChange({ ...section, ...patch });
  }

  function handleBodyChange(html: string) {
    onChange(normalizeCmsSectionBody({ ...section, html }));
  }

  return (
    <div className="space-y-3 rounded-2xl border border-gray-100 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-slate">Раздел {index + 1}</span>
        <Button type="button" size="sm" variant="ghost" onClick={onRemove}>
          Удалить
        </Button>
      </div>

      <Input
        value={section.heading ?? ""}
        onChange={(e) => patch({ heading: e.target.value })}
        placeholder="Заголовок раздела (необязательно)"
      />

      <div className="space-y-1">
        <span className="text-xs text-slate">Текст раздела</span>
        <RichTextEditor
          value={editorValue}
          onChange={handleBodyChange}
          maxLength={CMS_SECTION_HTML_MAX}
          minHeight={160}
          toolbar="full"
          placeholder="Абзацы, списки, ссылки, цитаты…"
        />
      </div>

      <label className="block space-y-1 text-xs text-slate">
        Маркированный список (по одному пункту на строку)
        <textarea
          className="min-h-[60px] w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-charcoal"
          value={listToLines(section.list)}
          onChange={(e) => patch({ list: linesToList(e.target.value) })}
        />
      </label>
    </div>
  );
}
