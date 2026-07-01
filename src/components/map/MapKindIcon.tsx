"use client";

import {
  Building2,
  Bus,
  Compass,
  Landmark,
  MapPin,
  Plane,
  Route,
  Trees,
  type LucideIcon,
} from "lucide-react";
import type { MapMarkerKind } from "@/lib/map-types";
import { cn } from "@/lib/cn";

const MAP_KIND_LUCIDE: Record<MapMarkerKind, LucideIcon> = {
  city: Building2,
  national_park: Trees,
  attraction: Landmark,
  tour: Compass,
  airport: Plane,
  transport: Bus,
  route: Route,
  region: MapPin,
};

type Props = {
  kind: MapMarkerKind;
  className?: string;
  style?: React.CSSProperties;
};

export default function MapKindIcon({ kind, className, style }: Props) {
  const Icon = MAP_KIND_LUCIDE[kind] ?? MapPin;
  return <Icon className={cn("shrink-0", className)} style={style} aria-hidden />;
}

export { MAP_KIND_LUCIDE };
