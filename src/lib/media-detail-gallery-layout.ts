import { dedupeGalleryImages, galleryImageIdentityKey } from "@/lib/gallery-images";

export type MosaicCell = {
  colStart: number;
  colEnd: number;
  rowStart: number;
  rowEnd: number;
  showAllOverlay?: boolean;
};

export type MosaicLayoutTemplate = {
  id: string;
  columns: number;
  rows: number;
  cells: MosaicCell[];
};

/** Desktop bento templates — up to 5 visible photos + «Все фото» overlay. */
export const MOSAIC_LAYOUT_TEMPLATES: MosaicLayoutTemplate[] = [
  {
    id: "left-hero",
    columns: 4,
    rows: 2,
    cells: [
      { colStart: 1, colEnd: 3, rowStart: 1, rowEnd: 3 },
      { colStart: 3, colEnd: 4, rowStart: 1, rowEnd: 2 },
      { colStart: 4, colEnd: 5, rowStart: 1, rowEnd: 2 },
      { colStart: 3, colEnd: 4, rowStart: 2, rowEnd: 3 },
      { colStart: 4, colEnd: 5, rowStart: 2, rowEnd: 3, showAllOverlay: true },
    ],
  },
  {
    id: "right-hero",
    columns: 4,
    rows: 2,
    cells: [
      { colStart: 1, colEnd: 2, rowStart: 1, rowEnd: 2 },
      { colStart: 2, colEnd: 3, rowStart: 1, rowEnd: 2 },
      { colStart: 1, colEnd: 2, rowStart: 2, rowEnd: 3 },
      { colStart: 2, colEnd: 3, rowStart: 2, rowEnd: 3, showAllOverlay: true },
      { colStart: 3, colEnd: 5, rowStart: 1, rowEnd: 3 },
    ],
  },
  {
    id: "tripster-split",
    columns: 5,
    rows: 2,
    cells: [
      { colStart: 1, colEnd: 2, rowStart: 1, rowEnd: 3 },
      { colStart: 2, colEnd: 4, rowStart: 1, rowEnd: 2 },
      { colStart: 2, colEnd: 3, rowStart: 2, rowEnd: 3 },
      { colStart: 3, colEnd: 4, rowStart: 2, rowEnd: 3 },
      { colStart: 4, colEnd: 6, rowStart: 1, rowEnd: 3, showAllOverlay: true },
    ],
  },
  {
    id: "center-band",
    columns: 4,
    rows: 3,
    cells: [
      { colStart: 1, colEnd: 2, rowStart: 1, rowEnd: 4 },
      { colStart: 2, colEnd: 4, rowStart: 1, rowEnd: 3 },
      { colStart: 2, colEnd: 3, rowStart: 3, rowEnd: 4 },
      { colStart: 3, colEnd: 4, rowStart: 3, rowEnd: 4, showAllOverlay: true },
      { colStart: 4, colEnd: 5, rowStart: 1, rowEnd: 4 },
    ],
  },
  {
    id: "top-banner",
    columns: 4,
    rows: 2,
    cells: [
      { colStart: 1, colEnd: 5, rowStart: 1, rowEnd: 2 },
      { colStart: 1, colEnd: 2, rowStart: 2, rowEnd: 3 },
      { colStart: 2, colEnd: 3, rowStart: 2, rowEnd: 3 },
      { colStart: 3, colEnd: 4, rowStart: 2, rowEnd: 3 },
      { colStart: 4, colEnd: 5, rowStart: 2, rowEnd: 3, showAllOverlay: true },
    ],
  },
];

export type MosaicSlot = {
  imageIndex: number;
  cell: MosaicCell;
};

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function pickLayoutTemplate(imageCount: number, seed: string): MosaicLayoutTemplate {
  if (imageCount <= 1) {
    return {
      id: "single",
      columns: 1,
      rows: 1,
      cells: [{ colStart: 1, colEnd: 2, rowStart: 1, rowEnd: 2 }],
    };
  }

  if (imageCount === 2) {
    return {
      id: "duo",
      columns: 2,
      rows: 1,
      cells: [
        { colStart: 1, colEnd: 2, rowStart: 1, rowEnd: 2 },
        { colStart: 2, colEnd: 3, rowStart: 1, rowEnd: 2, showAllOverlay: true },
      ],
    };
  }

  if (imageCount === 3) {
    const mirrored = hashString(`${seed}:mirror`) % 2 === 1;
    return {
      id: mirrored ? "trio-right" : "trio-left",
      columns: 3,
      rows: 2,
      cells: mirrored
        ? [
            { colStart: 1, colEnd: 2, rowStart: 1, rowEnd: 2 },
            { colStart: 1, colEnd: 2, rowStart: 2, rowEnd: 3 },
            { colStart: 2, colEnd: 4, rowStart: 1, rowEnd: 3, showAllOverlay: true },
          ]
        : [
            { colStart: 1, colEnd: 3, rowStart: 1, rowEnd: 3 },
            { colStart: 3, colEnd: 4, rowStart: 1, rowEnd: 2 },
            { colStart: 3, colEnd: 4, rowStart: 2, rowEnd: 3, showAllOverlay: true },
          ],
    };
  }

  if (imageCount === 4) {
    return {
      id: "quad",
      columns: 2,
      rows: 2,
      cells: [
        { colStart: 1, colEnd: 2, rowStart: 1, rowEnd: 2 },
        { colStart: 2, colEnd: 3, rowStart: 1, rowEnd: 2 },
        { colStart: 1, colEnd: 2, rowStart: 2, rowEnd: 3 },
        { colStart: 2, colEnd: 3, rowStart: 2, rowEnd: 3, showAllOverlay: true },
      ],
    };
  }

  const layoutIndex = hashString(seed) % MOSAIC_LAYOUT_TEMPLATES.length;
  return MOSAIC_LAYOUT_TEMPLATES[layoutIndex]!;
}

/** Stable pseudo-random mosaic: layout + which photos fill slots change per seed. */
export function buildGalleryMosaicPlan(
  images: string[],
  seed: string,
  maxVisible = 5,
): { layout: MosaicLayoutTemplate; slots: MosaicSlot[]; images: string[] } {
  const deduped = dedupeGalleryImages(images.filter(Boolean));
  const imageCount = deduped.length;
  const layout = pickLayoutTemplate(imageCount, seed);
  const visibleCount = Math.min(maxVisible, imageCount, layout.cells.length);

  if (imageCount === 0) {
    return { layout, slots: [], images: deduped };
  }

  const start = imageCount > visibleCount ? hashString(`${seed}:offset`) % imageCount : 0;
  const pickedIndices: number[] = [];
  const usedKeys = new Set<string>();
  let cursor = start;
  let guard = 0;

  while (pickedIndices.length < visibleCount && guard < imageCount * 2) {
    const imageIndex = cursor % imageCount;
    const key = galleryImageIdentityKey(deduped[imageIndex]!);
    if (!usedKeys.has(key)) {
      usedKeys.add(key);
      pickedIndices.push(imageIndex);
    }
    cursor += 1;
    guard += 1;
  }

  while (pickedIndices.length < visibleCount) {
    pickedIndices.push(pickedIndices.length % imageCount);
  }

  const slots: MosaicSlot[] = layout.cells.slice(0, visibleCount).map((cell, slotIndex) => ({
    cell,
    imageIndex: pickedIndices[slotIndex] ?? slotIndex,
  }));

  return { layout, slots, images: deduped };
}

export function mosaicCellStyle(cell: MosaicCell): {
  gridColumn: string;
  gridRow: string;
} {
  return {
    gridColumn: `${cell.colStart} / ${cell.colEnd}`,
    gridRow: `${cell.rowStart} / ${cell.rowEnd}`,
  };
}
