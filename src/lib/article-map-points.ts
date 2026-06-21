import type { BlogPost } from "@/types";
import type { BlogBodyBlock } from "@/types/blog-content-blocks";

export type ArticleMapPoint = {
  id: string;
  lat: number;
  lng: number;
  label: string;
  href?: string;
};

function pushUnique(points: ArticleMapPoint[], point: ArticleMapPoint) {
  const key = `${point.lat.toFixed(4)}:${point.lng.toFixed(4)}`;
  if (points.some((p) => `${p.lat.toFixed(4)}:${p.lng.toFixed(4)}` === key)) return;
  points.push(point);
}

export function extractArticleMapPoints(post: BlogPost): ArticleMapPoint[] {
  const points: ArticleMapPoint[] = [];

  for (const section of post.sections ?? []) {
    for (const block of section.blocks ?? []) {
      extractFromBlock(block, points);
    }
  }

  return points;
}

function extractFromBlock(block: BlogBodyBlock, points: ArticleMapPoint[]) {
  if (block.type === "map") {
    pushUnique(points, {
      id: `map-${block.lat}-${block.lng}`,
      lat: block.lat,
      lng: block.lng,
      label: block.label,
    });
    return;
  }

  if (block.type === "route-map") {
    for (const point of block.points ?? []) {
      pushUnique(points, {
        id: `route-${point.lat}-${point.lng}`,
        lat: point.lat,
        lng: point.lng,
        label: point.label,
      });
    }
    return;
  }
}
