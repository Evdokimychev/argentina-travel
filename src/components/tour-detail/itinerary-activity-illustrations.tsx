import type { ReactElement } from "react";
import type { ItineraryActivityKind } from "@/data/itinerary-activity-kinds";
import { cn } from "@/lib/cn";

type IllustrationId =
  | "hike"
  | "drive"
  | "bus"
  | "plane"
  | "boat"
  | "bike"
  | "wildlife"
  | "food"
  | "culture"
  | "water"
  | "mountain"
  | "time"
  | "lodging"
  | "camera"
  | "default";

const svgProps = {
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.45,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function HikeIllustration() {
  return (
    <svg {...svgProps}>
      <path d="M5 20h14" />
      <path d="M7 20 9.5 13l2-2 1.5 1 2.5-4 2 1.5" />
      <circle cx="12.5" cy="6.5" r="1.6" />
      <path d="M12.5 8.2v1.8" />
      <path d="M8 11.5 6.5 20" />
      <path d="M16 12.5 17.5 20" />
      <path d="M6 14.5 4 11" />
      <path d="M18 10 20 7" />
      <path d="M9.5 13 8 10.5" />
    </svg>
  );
}

function DriveIllustration() {
  return (
    <svg {...svgProps}>
      <path d="M4 14h16" />
      <path d="M5.5 14 7 9h10l1.5 5" />
      <path d="M7 9 8.5 6h7L17 9" />
      <path d="M8.5 6 9 4h6l.5 2" />
      <circle cx="8" cy="14" r="1.5" />
      <circle cx="16" cy="14" r="1.5" />
      <path d="M9.5 7h5" />
    </svg>
  );
}

function BusIllustration() {
  return (
    <svg {...svgProps}>
      <path d="M6 8h12v8H6z" />
      <path d="M6 11h12" />
      <path d="M8.5 9.5h2.5M13 9.5h2.5" />
      <circle cx="9" cy="16" r="1.2" />
      <circle cx="15" cy="16" r="1.2" />
      <path d="M8 16h8" />
      <path d="M6 8 7.5 5.5h9L18 8" />
    </svg>
  );
}

function PlaneIllustration() {
  return (
    <svg {...svgProps}>
      <path d="M12 4 9 10h6l-3-6z" />
      <path d="M9 10h6" />
      <path d="M6 11.5 9 10" />
      <path d="M15 10l3 1.5" />
      <path d="M10 13.5 8 19" />
      <path d="M14 13.5 16 19" />
      <path d="M11 13.5h2" />
    </svg>
  );
}

function BoatIllustration() {
  return (
    <svg {...svgProps}>
      <path d="M4 14c2 2 14 2 16 0" />
      <path d="M6 14 8 10h8l2 4" />
      <path d="M10 10V7M14 10V7" />
      <path d="M12 5v2" />
      <path d="M3 16h18" />
    </svg>
  );
}

function BikeIllustration() {
  return (
    <svg {...svgProps}>
      <circle cx="7" cy="16" r="2.5" />
      <circle cx="17" cy="16" r="2.5" />
      <path d="M9.5 16 12 10l2.5 2" />
      <path d="M12 10 14.5 6" />
      <path d="M14.5 12 17 16" />
      <path d="M9.5 16 12 13" />
    </svg>
  );
}

function WildlifeIllustration() {
  return (
    <svg {...svgProps}>
      <circle cx="10" cy="10" r="4.5" />
      <circle cx="10" cy="10" r="2" />
      <path d="M14.5 10.5 19 8" />
      <path d="M14.5 13 19 15" />
      <path d="M6 8.5 3.5 7" />
      <path d="M6 11.5 3.5 13" />
    </svg>
  );
}

function FoodIllustration() {
  return (
    <svg {...svgProps}>
      <path d="M8 5v8c0 1.5 1 2.5 2.5 2.5h3c1.5 0 2.5-1 2.5-2.5V5" />
      <path d="M8 9h8" />
      <path d="M12 5V3.5" />
      <path d="M5 8H3M5 11H3" />
      <path d="M21 8h-2M21 11h-2" />
    </svg>
  );
}

function CultureIllustration() {
  return (
    <svg {...svgProps}>
      <path d="M5 19V9l7-4 7 4v10" />
      <path d="M5 19h14" />
      <path d="M9 19v-5h6v5" />
      <path d="M9 11h6" />
      <path d="M12 5v2" />
    </svg>
  );
}

function WaterIllustration() {
  return (
    <svg {...svgProps}>
      <path d="M4 14c2 1.5 4 1.5 6 0s4-1.5 6 0 4 1.5 6 0" />
      <path d="M12 6c-1.5 2-3 3.5-3 5.5a3 3 0 0 0 6 0C15 9.5 13.5 8 12 6z" />
      <path d="M8 10l-1.5 2M16 10l1.5 2" />
    </svg>
  );
}

function MountainIllustration() {
  return (
    <svg {...svgProps}>
      <path d="M4 18 9 8l3 5 3-4 5 9" />
      <path d="M4 18h16" />
      <path d="M12 9v2" />
      <path d="M9.5 13 8 16" />
    </svg>
  );
}

function TimeIllustration() {
  return (
    <svg {...svgProps}>
      <circle cx="12" cy="12" r="7" />
      <path d="M12 8v4l2.5 2.5" />
    </svg>
  );
}

function LodgingIllustration() {
  return (
    <svg {...svgProps}>
      <path d="M4 18V9l8-4 8 4v9" />
      <path d="M4 18h16" />
      <path d="M9 18v-4h6v4" />
      <path d="M10 11h4" />
    </svg>
  );
}

function CameraIllustration() {
  return (
    <svg {...svgProps}>
      <path d="M5 8h3l1.5-2h5L16 8h3v9H5z" />
      <circle cx="12" cy="12.5" r="2.5" />
      <path d="M18 10h.01" />
    </svg>
  );
}

function DefaultIllustration() {
  return (
    <svg {...svgProps}>
      <circle cx="12" cy="12" r="7" />
      <path d="M12 8v4" />
      <circle cx="12" cy="15.5" r=".5" fill="currentColor" stroke="none" />
    </svg>
  );
}

const ILLUSTRATIONS: Record<IllustrationId, () => ReactElement> = {
  hike: HikeIllustration,
  drive: DriveIllustration,
  bus: BusIllustration,
  plane: PlaneIllustration,
  boat: BoatIllustration,
  bike: BikeIllustration,
  wildlife: WildlifeIllustration,
  food: FoodIllustration,
  culture: CultureIllustration,
  water: WaterIllustration,
  mountain: MountainIllustration,
  time: TimeIllustration,
  lodging: LodgingIllustration,
  camera: CameraIllustration,
  default: DefaultIllustration,
};

const KIND_ILLUSTRATION: Record<ItineraryActivityKind, IllustrationId> = {
  transfer: "bus",
  flight: "plane",
  departure: "bus",
  bus_tour: "bus",
  train: "bus",
  scenic_train: "bus",
  ferry: "boat",
  driving: "drive",
  scenic_drive: "drive",
  jeep: "drive",
  atv: "drive",
  motorcycle: "drive",
  helicopter: "plane",
  border_crossing: "drive",
  walking: "hike",
  city_walk: "hike",
  national_park: "mountain",
  viewpoint: "mountain",
  trekking: "hike",
  hiking: "hike",
  camping: "mountain",
  climbing: "mountain",
  ice_trek: "mountain",
  canyoning: "mountain",
  cycling: "bike",
  mountain_bike: "bike",
  boat_cruise: "boat",
  kayak: "boat",
  canoeing: "boat",
  sup: "water",
  rafting: "water",
  snorkeling: "water",
  diving: "water",
  sailing: "boat",
  swimming: "water",
  wildlife: "wildlife",
  wildlife_drive: "wildlife",
  whale_watching: "wildlife",
  dolphin_watching: "wildlife",
  penguin_watching: "wildlife",
  seal_watching: "wildlife",
  birdwatching: "wildlife",
  wine: "food",
  brewery: "food",
  food: "food",
  asado: "food",
  mate: "food",
  coffee: "food",
  cooking: "food",
  market: "culture",
  museum: "culture",
  cultural: "culture",
  architecture: "culture",
  religious: "culture",
  archaeological: "culture",
  tango: "culture",
  folklore: "culture",
  dance: "culture",
  concert: "culture",
  nightlife: "culture",
  soccer: "culture",
  photo: "camera",
  free_time: "time",
  briefing: "time",
  check_in: "lodging",
  glacier: "mountain",
  volcano: "mountain",
  hot_springs: "water",
  beach: "water",
  waterfall: "water",
  cave: "mountain",
  horseback: "hike",
  estancia: "culture",
  fishing: "water",
  shopping: "culture",
  spa: "lodging",
  yoga: "hike",
  meditation: "time",
  stargazing: "mountain",
  zip_line: "mountain",
  paragliding: "plane",
  balloon: "plane",
  skiing: "mountain",
  snowboarding: "mountain",
  sandboarding: "mountain",
  surf: "water",
  picnic: "food",
  workshop: "culture",
  graffiti: "culture",
  community: "culture",
  custom: "default",
};

export function ItineraryActivityIllustration({
  kind,
  compact = false,
}: {
  kind: ItineraryActivityKind | string;
  compact?: boolean;
}) {
  const id = KIND_ILLUSTRATION[kind as ItineraryActivityKind] ?? "default";
  const Illustration = ILLUSTRATIONS[id];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center text-charcoal",
        compact ? "h-6 w-6 [&_svg]:h-[17px] [&_svg]:w-[17px]" : "h-8 w-8 [&_svg]:h-[22px] [&_svg]:w-[22px]"
      )}
    >
      <Illustration />
    </span>
  );
}
