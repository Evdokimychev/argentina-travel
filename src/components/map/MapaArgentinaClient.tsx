"use client";

import ArgentinaMapFullscreenHub from "@/components/map/ArgentinaMapFullscreenHub";
import type { MapArgentinaUrlState } from "@/lib/map-argentina-url-state";
import type { MapObjectsPayload } from "@/lib/map-types";

type Props = {
  initialData: MapObjectsPayload;
  initialState: MapArgentinaUrlState;
};

export default function MapaArgentinaClient({ initialData, initialState }: Props) {
  return <ArgentinaMapFullscreenHub initialData={initialData} initialState={initialState} />;
}
