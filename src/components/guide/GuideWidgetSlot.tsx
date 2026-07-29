import { Suspense } from "react";
import ArgentinaExchangeRates from "@/components/guide/ArgentinaExchangeRates";
import ArgentinaSeasonMatrix from "@/components/travel/ArgentinaSeasonMatrix";
import ArgentinaTourismInfographic from "@/components/travel/ArgentinaTourismInfographic";
import ArgentinaTourismTimeline from "@/components/travel/ArgentinaTourismTimeline";
import ArgentinaWeatherPanel, {
  ArgentinaWeatherPanelSkeleton,
} from "@/components/guide/weather/ArgentinaWeatherPanel";
import TourEmbedSection from "@/components/embed/TourEmbedSection";
import { resolveGuideTourEmbedState } from "@/lib/guide-pillar-tour-data";
import { siteScrollAnchorClass } from "@/lib/site-container";
import type { GuidePillarWidgetSlot } from "@/types/guide-pillar";
import type { TourListing } from "@/types";

type GuideWidgetSlotProps = {
  slot: GuidePillarWidgetSlot;
  initialTours?: TourListing[] | Promise<TourListing[]>;
};

function TourEmbedLoading() {
  return (
    <div className="rounded-3xl border border-gray-100 bg-surface-muted/50 p-5 sm:p-6" aria-busy="true">
      <span className="sr-only">Загружаем подборку туров…</span>
      <div className="h-5 w-48 animate-pulse rounded bg-gray-200" />
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-32 animate-pulse rounded-2xl bg-gray-100" />
        ))}
      </div>
    </div>
  );
}

async function TourEmbedContent({
  slot,
  initialTours,
}: Required<Pick<GuideWidgetSlotProps, "slot" | "initialTours">>) {
  const state = await resolveGuideTourEmbedState(initialTours);
  if (state.status === "unavailable") {
    return (
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-charcoal sm:p-6" role="status">
        <p className="font-heading text-base font-bold">Подборка туров временно недоступна</p>
        <p className="mt-2 text-sm leading-relaxed text-slate">
          Основной материал доступен. Попробуйте вернуться к подборке позже.
        </p>
      </div>
    );
  }

  if (!slot.tourEmbed || state.tours.length === 0) return null;
  return (
    <TourEmbedSection
      config={{ ...slot.tourEmbed, tone: slot.tourEmbed.tone ?? "muted" }}
      initialTours={state.tours}
    />
  );
}

export default function GuideWidgetSlot({ slot, initialTours }: GuideWidgetSlotProps) {
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

  if (slot.type === "tour-embed" && slot.tourEmbed && initialTours) {
    return (
      <div id={slot.id} className={siteScrollAnchorClass}>
        <Suspense fallback={<TourEmbedLoading />}>
          <TourEmbedContent slot={slot} initialTours={initialTours} />
        </Suspense>
      </div>
    );
  }

  return null;
}
