"use client";

import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";
import type { ArticleMapPoint } from "@/lib/article-map-points";
import { cn } from "@/lib/cn";

const ArticlePlacesMiniMap = dynamic(
  () => import("@/components/blog/ArticlePlacesMiniMap"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[200px] items-center justify-center bg-surface-muted text-sm text-slate">
        Загрузка карты…
      </div>
    ),
  },
);

type BlogInlineMapBlockProps = {
  points: ArticleMapPoint[];
  className?: string;
};

/** Inline-карта с ленивой подгрузкой Leaflet. */
export default function BlogInlineMapBlock({ points, className }: BlogInlineMapBlockProps) {
  if (points.length === 0) return null;

  return (
    <div className={cn("overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm", className)}>
      <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
        <MapPin className="h-4 w-4 text-sky" aria-hidden />
        <p className="text-sm font-semibold text-charcoal">
          {points.length === 1 ? points[0].label : `${points.length} мест на карте`}
        </p>
      </div>
      <ArticlePlacesMiniMap points={points} embedded className="border-0 shadow-none" />
    </div>
  );
}
