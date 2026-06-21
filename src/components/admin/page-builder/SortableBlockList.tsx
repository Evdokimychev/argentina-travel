"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import PageBuilderBlockCard from "@/components/admin/page-builder/PageBuilderBlockCard";
import type { BlogBodyBlock } from "@/types/blog-content-blocks";

type Props = {
  blocks: BlogBodyBlock[];
  onChange: (blocks: BlogBodyBlock[]) => void;
  onPickMedia?: (blockIndex: number) => void;
};

function SortableBlockItem({
  id,
  block,
  index,
  total,
  onChange,
  onRemove,
  onPickMedia,
}: {
  id: string;
  block: BlogBodyBlock;
  index: number;
  total: number;
  onChange: (block: BlogBodyBlock) => void;
  onRemove: () => void;
  onPickMedia?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <PageBuilderBlockCard
        block={block}
        index={index}
        total={total}
        onChange={onChange}
        onRemove={onRemove}
        onMoveUp={() => {}}
        onMoveDown={() => {}}
        onPickMedia={onPickMedia}
        dragHandleProps={listeners}
        hideMoveButtons
      />
    </div>
  );
}

export default function SortableBlockList({ blocks, onChange, onPickMedia }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const ids = blocks.map((_, index) => `block-${index}`);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;

    onChange(arrayMove(blocks, oldIndex, newIndex));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {blocks.map((block, index) => (
            <SortableBlockItem
              key={ids[index]}
              id={ids[index]!}
              block={block}
              index={index}
              total={blocks.length}
              onChange={(next) => {
                const copy = [...blocks];
                copy[index] = next;
                onChange(copy);
              }}
              onRemove={() => onChange(blocks.filter((_, i) => i !== index))}
              onPickMedia={
                block.type === "media" || block.type === "gallery"
                  ? () => onPickMedia?.(index)
                  : undefined
              }
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
