import { Suspense } from "react";
import ArgentinaExchangeRates from "@/components/guide/ArgentinaExchangeRates";
import ArgentinaWeatherPanel, {
  ArgentinaWeatherPanelSkeleton,
} from "@/components/guide/weather/ArgentinaWeatherPanel";
import TourEmbedSection from "@/components/embed/TourEmbedSection";
import { siteScrollAnchorClass } from "@/lib/site-container";
import type { GuidePillarWidgetSlot } from "@/types/guide-pillar";
import type { TourListing } from "@/types";

type GuideWidgetSlotProps = {
  slot: GuidePillarWidgetSlot;
  initialTours?: TourListing[];
};

export default function GuideWidgetSlot({ slot, initialTours = [] }: GuideWidgetSlotProps) {
  if (slot.type === "exchange-rates") {
    return (
      <div id={slot.id} className={siteScrollAnchorClass}>
        <ArgentinaExchangeRates />
      </div>
    );
  }

  if (slot.type === "weather-panel") {
    return (
      <div id={slot.id} className={siteScrollAnchorClass}>
        <Suspense fallback={<ArgentinaWeatherPanelSkeleton />}>
          <ArgentinaWeatherPanel />
        </Suspense>
      </div>
    );
  }

  if (slot.type === "tour-embed" && slot.tourEmbed && initialTours.length > 0) {
    return (
      <div id={slot.id} className={siteScrollAnchorClass}>
        <TourEmbedSection
          config={{ ...slot.tourEmbed, tone: slot.tourEmbed.tone ?? "muted" }}
          initialTours={initialTours}
        />
      </div>
    );
  }

  // Unimplemented placeholder slots (calculator/map/promo) are hidden until ready.
  return null;
}
