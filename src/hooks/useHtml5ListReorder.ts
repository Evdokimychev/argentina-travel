"use client";

import { useCallback, useState } from "react";

export interface Html5ListReorderHandlers {
  dragIndex: number | null;
  overIndex: number | null;
  canReorder: boolean;
  onDragStart: (index: number, event: React.DragEvent<HTMLElement>) => void;
  onDragEnd: () => void;
  onDragOver: (index: number, event: React.DragEvent<HTMLElement>) => void;
  onDrop: (index: number, event: React.DragEvent<HTMLElement>) => void;
  rowClassName: (index: number) => string;
}

export function useHtml5ListReorder<T>(
  items: T[],
  onReorder: (next: T[]) => void
): Html5ListReorderHandlers {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const canReorder = items.length > 1;

  const reorder = useCallback(
    (from: number, to: number) => {
      if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return;
      const next = [...items];
      const [removed] = next.splice(from, 1);
      next.splice(to, 0, removed);
      onReorder(next);
    },
    [items, onReorder]
  );

  const onDragStart = useCallback((index: number, event: React.DragEvent<HTMLElement>) => {
    setDragIndex(index);
    setOverIndex(index);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(index));
  }, []);

  const onDragEnd = useCallback(() => {
    setDragIndex(null);
    setOverIndex(null);
  }, []);

  const onDragOver = useCallback(
    (index: number, event: React.DragEvent<HTMLElement>) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      if (dragIndex !== null && index !== dragIndex) {
        setOverIndex(index);
      }
    },
    [dragIndex]
  );

  const onDrop = useCallback(
    (index: number, event: React.DragEvent<HTMLElement>) => {
      event.preventDefault();
      if (dragIndex === null) return;
      reorder(dragIndex, index);
      setDragIndex(null);
      setOverIndex(null);
    },
    [dragIndex, reorder]
  );

  const rowClassName = useCallback(
    (index: number) => {
      const classes: string[] = [];
      if (dragIndex === index) classes.push("opacity-50");
      if (overIndex === index && dragIndex !== null && dragIndex !== index) {
        classes.push("ring-2 ring-brand/25");
      }
      return classes.join(" ");
    },
    [dragIndex, overIndex]
  );

  return {
    dragIndex,
    overIndex,
    canReorder,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDrop,
    rowClassName,
  };
}
