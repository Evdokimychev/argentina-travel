/** Thematic photos for climate month cards (Unsplash). */
const MONTH_IMAGES: Record<number, string> = {
  1: "https://images.unsplash.com/photo-1589909202803-4a2a090a8438?w=600&q=80",
  2: "https://images.unsplash.com/photo-1555881400-74d7aca8a9b0?w=600&q=80",
  3: "https://images.unsplash.com/photo-1611003229172-2a034c73c473?w=600&q=80",
  4: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80",
  5: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&q=80",
  6: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&q=80",
  7: "https://images.unsplash.com/photo-1483728642387-6bc3bd38dafc?w=600&q=80",
  8: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&q=80",
  9: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&q=80",
  10: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80",
  11: "https://images.unsplash.com/photo-1518173946687-4eef58136209?w=600&q=80",
  12: "https://images.unsplash.com/photo-1516026672322-bc52d69a0993?w=600&q=80",
};

const REGION_MONTH_OVERRIDES: Record<string, Partial<Record<number, string>>> = {
  ba: {
    1: "https://images.unsplash.com/photo-1589909202803-4a2a090a8438?w=600&q=80",
    6: "https://images.unsplash.com/photo-1483728642387-6bc3bd38dafc?w=600&q=80",
  },
  patagonia: {
    1: "https://images.unsplash.com/photo-1682687220063-4742bd7fd538?w=600&q=80",
    2: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&q=80",
    7: "https://images.unsplash.com/photo-1551524164-6cf2ac531f64?w=600&q=80",
    11: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80",
  },
  iguazu: {
    2: "https://images.unsplash.com/photo-1547036967-23d11aeea346?w=600&q=80",
    3: "https://images.unsplash.com/photo-1432407693019-9c7b31685d23?w=600&q=80",
    12: "https://images.unsplash.com/photo-1516026672322-bc52d69a0993?w=600&q=80",
  },
  salta: {
    4: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80",
    5: "https://images.unsplash.com/photo-1464822759844-d150ba022ca3?w=600&q=80",
    9: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80",
  },
  mendoza: {
    3: "https://images.unsplash.com/photo-1506377247727-2a5a3d117966?w=600&q=80",
    4: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&q=80",
    9: "https://images.unsplash.com/photo-1474722883778-792e7990302f?w=600&q=80",
  },
};

export function getClimateMonthImage(regionId: string, month: number): string {
  return REGION_MONTH_OVERRIDES[regionId]?.[month] ?? MONTH_IMAGES[month] ?? MONTH_IMAGES[1];
}

export type ClimateViewMode = "cards" | "schedule";
