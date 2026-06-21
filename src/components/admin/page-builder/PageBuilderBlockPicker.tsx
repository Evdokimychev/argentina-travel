"use client";

import {
  PAGE_BUILDER_BLOCKS,
  PAGE_BUILDER_BLOCK_GROUPS,
  type PageBuilderBlockGroup,
  type PageBuilderBlockSlug,
} from "@/lib/cms/page-builder/block-registry";

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (slug: PageBuilderBlockSlug) => void;
};

export default function PageBuilderBlockPicker({ open, onClose, onSelect }: Props) {
  if (!open) return null;

  const groups = Object.keys(PAGE_BUILDER_BLOCK_GROUPS) as PageBuilderBlockGroup[];

  return (
    <div
      className="fixed inset-0 z-[95] flex justify-end bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-label="Добавить блок"
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-md flex-col bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-gray-100 px-4 py-3">
          <h3 className="font-heading text-base font-bold text-charcoal">Добавить блок</h3>
          <p className="mt-1 text-xs text-slate">Паттерн Payload blocks drawer</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {groups.map((group) => {
            const meta = PAGE_BUILDER_BLOCK_GROUPS[group];
            const blocks = PAGE_BUILDER_BLOCKS.filter((b) => b.group === group);
            return (
              <div key={group} className="mb-6">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate">
                  {meta.label}
                </p>
                <p className="mb-2 text-[11px] text-slate">{meta.description}</p>
                <ul className="space-y-2">
                  {blocks.map((block) => {
                    const Icon = block.icon;
                    return (
                      <li key={block.slug}>
                        <button
                          type="button"
                          className="flex w-full items-start gap-3 rounded-xl border border-gray-100 px-3 py-2.5 text-left transition hover:border-sky/40 hover:bg-sky/5"
                          onClick={() => {
                            onSelect(block.slug);
                            onClose();
                          }}
                        >
                          <Icon className="mt-0.5 h-4 w-4 shrink-0 text-sky" aria-hidden />
                          <span>
                            <span className="block text-sm font-medium text-charcoal">
                              {block.label}
                            </span>
                            <span className="block text-xs text-slate">{block.description}</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
