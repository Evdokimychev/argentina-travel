import { Suspense } from "react";
import ArgentinaExchangeRates from "@/components/guide/ArgentinaExchangeRates";
import ArgentinaSeasonMatrix, {
  ArgentinaSeasonMatrixSkeleton,
} from "@/components/travel/ArgentinaSeasonMatrix";
import ArgentinaTourismInfographic from "@/components/travel/ArgentinaTourismInfographic";
import ArgentinaTourismTimeline from "@/components/travel/ArgentinaTourismTimeline";
import ArgentinaWeatherPanel, {
  ArgentinaWeatherPanelSkeleton,
} from "@/components/guide/weather/ArgentinaWeatherPanel";
import TourEmbedSection from "@/components/embed/TourEmbedSection";
import { siteScrollAnchorClass } from "@/lib/site-container";
import { cn } from "@/lib/cn";
import type { GuidePillarWidgetSlot, GuidePillarWidgetSlotType } from "@/types/guide-pillar";
import type { TourListing } from "@/types";

const COMING_SOON_LABELS: Partial<Record<GuidePillarWidgetSlotType, string>> = {
  calculator: "Калькулятор",
  map: "Интерактивная карта",
  promo: "Промо-блок",
  "tour-embed": "Подборка туров",
};

function GuideWidgetComingSoon({ slot }: { slot: GuidePillarWidgetSlot }) {
  const title = slot.label.trim() || COMING_SOON_LABELS[slot.type] || "Виджет";

  return (
    <div id={slot.id} className={siteScrollAnchorClass}>
      <aside
        className={cn(
          "flex min-h-[7rem] items-center justify-center rounded-2xl border border-dashed border-gray-200",
          "bg-surface-muted/40 px-6 py-5 text-center text-sm text-slate"
        )}
        aria-label={`${title} — скоро`}
      >
        {title} — скоро
      </aside>
    </div>
  );
}

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

  if (slot.type === "season-matrix") {
    return (
      <div id={slot.id} className={siteScrollAnchorClass}>
        <ArgentinaSeasonMatrix />
      </div>
    );
  }

  if (slot.type === "tourism-infographic") {
    return (
      <div id={slot.id} className={siteScrollAnchorClass}>
        <ArgentinaTourismInfographic />
      </div>
    );
  }

  if (slot.type === "tourism-timeline") {
    return (
      <div id={slot.id} className={siteScrollAnchorClass}>
        <ArgentinaTourismTimeline />
      </div>
    );
  }

  if (slot.type === "tour-embed") {
    if (slot.tourEmbed && initialTours.length > 0) {
      return (
        <div id={slot.id} className={siteScrollAnchorClass}>
          <TourEmbedSection
            config={{ ...slot.tourEmbed, tone: slot.tourEmbed.tone ?? "muted" }}
            initialTours={initialTours}
          />
        </div>
      );
    }
    return <GuideWidgetComingSoon slot={slot} />;
  }

  return <GuideWidgetComingSoon slot={slot} />;
}
