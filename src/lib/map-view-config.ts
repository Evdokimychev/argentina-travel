/** Настройки начального вида карты — для встраиваемых блоков (CABA и др.). */
export type MapViewConfig = {
  center: [number, number];
  zoom: number;
  minZoom?: number;
  maxZoom?: number;
  /** Ограничить панорамирование [[swLng, swLat], [neLng, neLat]] */
  maxBounds?: [[number, number], [number, number]];
  /** Не подгонять карту под маркеры объектов */
  lockView?: boolean;
};

export const ARGENTINA_MAP_VIEW: MapViewConfig = {
  center: [-64.2, -38.5],
  zoom: 4,
  minZoom: 3,
  maxZoom: 16,
};
