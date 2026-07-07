"use client";

import type { MapMarkerKind } from "@/lib/map-types";
import { MAP_KIND_COLORS } from "@/lib/map-kind-colors";

/** Lucide-style paths (24×24) for pin interior — white stroke icons. */
const KIND_ICON_PATHS: Partial<Record<MapMarkerKind, string>> = {
  city: `<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12h12"/><path d="M6 8h12"/><path d="M6 16h12"/>`,
  national_park: `<path d="M10 10v.2A3 3 0 0 1 8.8 13H5a2 2 0 0 1-2-2v-1a2 2 0 0 1 2-2h2"/><path d="M14 10v.2A3 3 0 0 0 15.2 13H19a2 2 0 0 0 2-2v-1a2 2 0 0 0-2-2h-2"/><path d="M12 22v-7l-2-2-2 2v7"/><path d="M12 11V3"/><path d="M8 7h8"/>`,
  attraction: `<line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7"/>`,
  tour: `<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>`,
  airport: `<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.2 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>`,
  transport: `<path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.1-.8 0-1.2A6 6 0 0 0 16 9H4a6 6 0 0 0-3.8 5c-.1.4-.1.8 0 1.2.3 1.1.8 2.8.8 2.8h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/>`,
};

const MARKER_KINDS_WITH_ICONS: MapMarkerKind[] = [
  "city",
  "national_park",
  "attraction",
  "tour",
  "airport",
  "transport",
];

type MapImageHost = {
  hasImage(id: string): boolean;
  addImage(id: string, image: HTMLImageElement, options?: { pixelRatio?: number }): void;
};

function lightenHex(hex: string, amount = 0.22): string {
  const raw = hex.replace("#", "");
  const num = Number.parseInt(raw, 16);
  const r = Math.min(255, ((num >> 16) & 255) + Math.round(255 * amount));
  const g = Math.min(255, ((num >> 8) & 255) + Math.round(255 * amount));
  const b = Math.min(255, (num & 255) + Math.round(255 * amount));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function buildPinSvg(kind: MapMarkerKind, color: string, selected: boolean): string {
  const iconPaths = KIND_ICON_PATHS[kind] ?? `<circle cx="12" cy="12" r="4" fill="#fff"/>`;
  const highlight = lightenHex(color);
  const scale = selected ? 1.1 : 1;
  const tx = selected ? -2.4 : 0;
  const ty = selected ? -2.8 : 0;
  const stroke = selected ? 3.2 : 2.8;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="52" height="62" viewBox="0 0 52 62">
  <defs>
    <linearGradient id="pinGrad" x1="22" y1="4" x2="22" y2="48" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${highlight}"/>
      <stop offset="100%" stop-color="${color}"/>
    </linearGradient>
    <filter id="pinShadow" x="-20%" y="-10%" width="140%" height="150%">
      <feDropShadow dx="0" dy="4" stdDeviation="3.5" flood-color="#0f172a" flood-opacity="0.28"/>
    </filter>
  </defs>
  <g transform="translate(${tx}, ${ty}) scale(${scale})" filter="url(#pinShadow)">
    <ellipse cx="22" cy="56" rx="9" ry="3.2" fill="rgba(15,23,42,0.16)"/>
    <path d="M22 52 C22 52 40 33 40 20 C40 9.4 32.1 1 22 1 C11.9 1 4 9.4 4 20 C4 33 22 52 22 52 Z"
      fill="url(#pinGrad)" stroke="#ffffff" stroke-width="${stroke}" stroke-linejoin="round"/>
    <circle cx="22" cy="20" r="11.5" fill="rgba(255,255,255,0.18)"/>
    <g transform="translate(10, 8)" stroke="#ffffff" fill="none" stroke-width="1.85"
      stroke-linecap="round" stroke-linejoin="round">
      ${iconPaths}
    </g>
  </g>
</svg>`;
}

function loadSvgImage(svg: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load marker SVG"));
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}

export function markerImageId(kind: MapMarkerKind, selected = false): string {
  return selected ? `marker-${kind}-selected` : `marker-${kind}`;
}

/** Register pin icons for all marker kinds on a MapLibre map instance. */
export async function registerMapMarkerImages(map: MapImageHost): Promise<void> {
  for (const kind of MARKER_KINDS_WITH_ICONS) {
    const color = MAP_KIND_COLORS[kind];
    for (const selected of [false, true]) {
      const id = markerImageId(kind, selected);
      if (map.hasImage(id)) continue;
      const img = await loadSvgImage(buildPinSvg(kind, color, selected));
      map.addImage(id, img, { pixelRatio: 2 });
    }
  }
}

export { MARKER_KINDS_WITH_ICONS };
