/** Grid clustering for map markers — shared by tours and places layers. */

export interface MapClusterItem {
  latitude: number;
  longitude: number;
}

export interface MapClusterCell<T extends MapClusterItem> {
  latitude: number;
  longitude: number;
  items: T[];
}

export function clusterMapItems<T extends MapClusterItem>(
  items: T[],
  zoom: number,
  threshold = 30
): MapClusterCell<T>[] {
  if (zoom >= 8 || items.length <= threshold) {
    return items.map((item) => ({
      latitude: item.latitude,
      longitude: item.longitude,
      items: [item],
    }));
  }

  const cellSize = 0.5 / Math.pow(2, zoom - 4);
  const cells = new Map<string, T[]>();

  for (const item of items) {
    const cellX = Math.floor(item.longitude / cellSize);
    const cellY = Math.floor(item.latitude / cellSize);
    const key = `${cellX}:${cellY}`;
    const list = cells.get(key) ?? [];
    list.push(item);
    cells.set(key, list);
  }

  return [...cells.values()].map((cellItems) => {
    const latitude =
      cellItems.reduce((sum, item) => sum + item.latitude, 0) / cellItems.length;
    const longitude =
      cellItems.reduce((sum, item) => sum + item.longitude, 0) / cellItems.length;
    return { latitude, longitude, items: cellItems };
  });
}
