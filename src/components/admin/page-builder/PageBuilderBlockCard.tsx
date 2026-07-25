"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, GripVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { renderBlogBodyBlock } from "@/components/blog/BlogSectionBody";
import PageBuilderBlockFields from "@/components/admin/page-builder/PageBuilderBlockFields";
import PageBuilderBlockValidation from "@/components/admin/page-builder/PageBuilderBlockValidation";
import { blockDefinitionFor } from "@/lib/cms/page-builder/block-registry";
import { supportsMediaPicker } from "@/lib/cms/page-builder/media-picker-blocks";
import { auditEditorialBlocks } from "@/editorial/utilities/audit";
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
  const findings = auditEditorialBlocks([block]);
  const errorCount = findings.filter((item) => item.level === "error").length;
  const warningCount = findings.filter((item) => item.level === "warning").length;

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
          {errorCount > 0 ? (
            <span className="ml-2 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">
              {errorCount} ош.
            </span>
          ) : warningCount > 0 ? (
            <span className="ml-2 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
              {warningCount}
            </span>
          ) : null}
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
            {preview ? "Поля" : "Просмотр"}
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
              onPickMedia={supportsMediaPicker(block.type) ? onPickMedia : undefined}
            />
          )}
          <PageBuilderBlockValidation block={block} />
        </div>
      ) : null}
    </div>
  );
}
