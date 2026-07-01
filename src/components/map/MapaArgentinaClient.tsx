"use client";

import dynamic from "next/dynamic";
import type { MapArgentinaUrlState } from "@/lib/map-argentina-url-state";
import type { MapObjectsPayload } from "@/lib/map-types";

const ArgentinaMapFullscreenHub = dynamic(
  () => import("@/components/map/ArgentinaMapFullscreenHub"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[calc(100dvh-var(--site-header-full-height,72px))] min-h-[520px] items-center justify-center bg-[#e8eef4] text-sm text-slate">
        Загрузка карты…
      </div>
    ),
  }
);

type Props = {
  initialData: MapObjectsPayload;
  initialState: MapArgentinaUrlState;
};

export default function MapaArgentinaClient({ initialData, initialState }: Props) {
  return <ArgentinaMapFullscreenHub initialData={initialData} initialState={initialState} />;
}
