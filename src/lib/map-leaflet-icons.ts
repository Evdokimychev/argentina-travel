/** Shared teardrop pin markup for Leaflet divIcon markers. */

export type MapPinTone = "brand" | "place" | "muted" | "accent";
export type MapPinSize = "sm" | "md" | "lg";

export type MapPinOptions = {
  tone?: MapPinTone;
  active?: boolean;
  size?: MapPinSize;
  /** Override pin fill color (CSS custom property). */
  color?: string;
};

type PinDimensions = {
  w: number;
  h: number;
  anchor: [number, number];
  popup: [number, number];
};

const PIN_SIZES: Record<MapPinSize, PinDimensions> = {
  sm: { w: 26, h: 32, anchor: [13, 29], popup: [0, -30] },
  md: { w: 32, h: 38, anchor: [16, 35], popup: [0, -36] },
  lg: { w: 40, h: 48, anchor: [20, 44], popup: [0, -44] },
};

function resolvePinSize(options: MapPinOptions): MapPinSize {
  if (options.size) return options.size;
  return options.active ? "lg" : "md";
}

export function buildMapPinHtml(options: MapPinOptions = {}): string {
  const tone = options.tone ?? "brand";
  const active = options.active ?? false;
  const size = resolvePinSize(options);
  const classes = [
    "map-pin",
    `map-pin--${tone}`,
    `map-pin--${size}`,
    active ? "map-pin--active" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const style = options.color ? ` style="--map-pin-color:${options.color}"` : "";

  return `<div class="${classes}"${style} aria-hidden="true"><span class="map-pin__bubble"><span class="map-pin__core"></span></span></div>`;
}

export function buildMapPinClusterHtml(count: number): string {
  return `<div class="map-pin-cluster" aria-hidden="true"><span class="map-pin-cluster__halo"></span><span class="map-pin-cluster__body"><span class="map-pin-cluster__count">${count}</span></span></div>`;
}

export type LeafletDivIconOptions = {
  className: string;
  html: string;
  iconSize: [number, number];
  iconAnchor: [number, number];
  popupAnchor: [number, number];
};

export function createMapPinDivIcon(options: MapPinOptions = {}): LeafletDivIconOptions {
  const size = resolvePinSize(options);
  const dims = PIN_SIZES[size];
  return {
    className: "",
    html: buildMapPinHtml(options),
    iconSize: [dims.w, dims.h],
    iconAnchor: dims.anchor,
    popupAnchor: dims.popup,
  };
}

export function createMapPinClusterDivIcon(count: number): LeafletDivIconOptions {
  return {
    className: "",
    html: buildMapPinClusterHtml(count),
    iconSize: [46, 46],
    iconAnchor: [23, 23],
    popupAnchor: [0, -26],
  };
}
