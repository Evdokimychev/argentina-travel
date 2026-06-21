"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, GripVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { renderBlogBodyBlock } from "@/components/blog/BlogSectionBody";
import PageBuilderBlockFields from "@/components/admin/page-builder/PageBuilderBlockFields";
import { blockDefinitionFor } from "@/lib/cms/page-builder/block-registry";
import type { BlogBodyBlock } from "@/types/blog-content-blocks";

type Props = {
  block: BlogBodyBlock;
  index: number;
  total: number;
  onChange: (block: BlogBodyBlock) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onPickMedia?: () => void;
  dragHandleProps?: Record<string, unknown>;
  hideMoveButtons?: boolean;
};

export default function PageBuilderBlockCard({
  block,
  index,
  total,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  onPickMedia,
  dragHandleProps,
  hideMoveButtons = false,
}: Props) {
  const [expanded, setExpanded] = useState(true);
  const [preview, setPreview] = useState(false);
  const def = blockDefinitionFor(block);
  const Icon = def.icon;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
        <button
          type="button"
          className="cursor-grab touch-none rounded p-0.5 text-slate/50 hover:text-slate active:cursor-grabbing"
          aria-label="Перетащить блок"
          {...dragHandleProps}
        >
          <GripVertical className="h-4 w-4" aria-hidden />
        </button>
        <Icon className="h-4 w-4 shrink-0 text-sky" aria-hidden />
        <button
          type="button"
          className="min-w-0 flex-1 text-left text-sm font-medium text-charcoal"
          onClick={() => setExpanded((v) => !v)}
        >
          {def.label}
          <span className="ml-2 font-mono text-[10px] text-slate">{block.type}</span>
        </button>
        <div className="flex shrink-0 items-center gap-0.5">
          {!hideMoveButtons ? (
            <>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                disabled={index === 0}
                onClick={onMoveUp}
                aria-label="Выше"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                disabled={index >= total - 1}
                onClick={onMoveDown}
                aria-label="Ниже"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-xs"
            onClick={() => setPreview((p) => !p)}
          >
            {preview ? "Поля" : "Preview"}
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-red-600"
            onClick={onRemove}
            aria-label="Удалить блок"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {expanded ? (
        <div className="p-3">
          {preview ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-surface-muted/30 p-4">
              {renderBlogBodyBlock(block, index)}
            </div>
          ) : (
            <PageBuilderBlockFields
              block={block}
              onChange={onChange}
              onPickMedia={
                block.type === "media" || block.type === "gallery" ? onPickMedia : undefined
              }
            />
          )}
        </div>
      ) : null}
    </div>
  );
}
