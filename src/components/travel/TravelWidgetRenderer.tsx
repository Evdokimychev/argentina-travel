import ArgentinaSeasonMatrix from "@/components/travel/ArgentinaSeasonMatrix";
import ArgentinaTourismInfographic from "@/components/travel/ArgentinaTourismInfographic";
import ArgentinaTourismTimeline from "@/components/travel/ArgentinaTourismTimeline";
import CarryOnPacking from "@/components/travel/CarryOnPacking";
import DestinationPackingCards from "@/components/travel/DestinationPackingCards";
import LayerSystem from "@/components/travel/LayerSystem";
import PackingList from "@/components/travel/PackingList";
import SteakCutSelector from "@/components/travel/SteakCutSelector";
import SteakDonenessPhrases from "@/components/travel/SteakDonenessPhrases";
import SteakCutDiagram from "@/components/travel/SteakCutDiagram";
import SteakOrderScenarios from "@/components/travel/SteakOrderScenarios";
import SteakBillExplainer from "@/components/travel/SteakBillExplainer";
import SummerWinterComparison from "@/components/travel/SummerWinterComparison";
import TripTypeSelector from "@/components/travel/TripTypeSelector";
import WhatNotToPack from "@/components/travel/WhatNotToPack";
import TangoGlossary from "@/components/travel/TangoGlossary";
import TangoPhrasebook from "@/components/travel/TangoPhrasebook";
import TangoRondaDiagram from "@/components/travel/TangoRondaDiagram";

/** Единственный источник истины для ключей встроенных редакционных виджетов. */
export const TRAVEL_WIDGET_KEYS = [
  "season-matrix",
  "tourism-infographic",
  "tourism-timeline",
  "steak-cut-selector",
  "steak-doneness-phrases",
  "steak-cut-diagram",
  "steak-order-scenarios",
  "steak-bill-explainer",
  "packing-list",
  "layer-system",
  "trip-type-selector",
  "destination-packing-cards",
  "summer-winter-comparison",
  "what-not-to-pack",
  "carry-on-packing",
  "tango-glossary",
  "tango-phrasebook",
  "tango-ronda-diagram",
] as const;

export type TravelWidgetKey = (typeof TRAVEL_WIDGET_KEYS)[number];

type Props = {
  widgetKey: string;
  className?: string;
  title?: string;
};

/** Рендер встроенных редакционных виджетов по ключу. */
export default function TravelWidgetRenderer({ widgetKey, className }: Props) {
  const key = widgetKey.trim();

  if (key === "season-matrix") {
    return <ArgentinaSeasonMatrix className={className} />;
  }

  if (key === "tourism-infographic") {
    return <ArgentinaTourismInfographic className={className} />;
  }

  if (key === "tourism-timeline") {
    return <ArgentinaTourismTimeline className={className} />;
  }

  if (key === "steak-cut-selector") {
    return <SteakCutSelector className={className} />;
  }

  if (key === "steak-doneness-phrases") {
    return <SteakDonenessPhrases className={className} />;
  }

  if (key === "steak-cut-diagram") {
    return <SteakCutDiagram className={className} />;
  }

  if (key === "steak-order-scenarios") {
    return <SteakOrderScenarios className={className} />;
  }

  if (key === "steak-bill-explainer") {
    return <SteakBillExplainer className={className} />;
  }

  if (key === "packing-list") {
    return <PackingList className={className} />;
  }

  if (key === "layer-system") {
    return <LayerSystem className={className} />;
  }

  if (key === "trip-type-selector") {
    return <TripTypeSelector className={className} />;
  }

  if (key === "destination-packing-cards") {
    return <DestinationPackingCards className={className} />;
  }

  if (key === "summer-winter-comparison") {
    return <SummerWinterComparison className={className} />;
  }

  if (key === "what-not-to-pack") {
    return <WhatNotToPack className={className} />;
  }

  if (key === "carry-on-packing") {
    return <CarryOnPacking className={className} />;
  }

  if (key === "tango-glossary") {
    return <TangoGlossary className={className} />;
  }

  if (key === "tango-phrasebook") {
    return <TangoPhrasebook className={className} />;
  }

  if (key === "tango-ronda-diagram") {
    return <TangoRondaDiagram className={className} />;
  }

  return null;
}
