import ArgentinaSeasonMatrix from "@/components/travel/ArgentinaSeasonMatrix";
import ArgentinaTourismInfographic from "@/components/travel/ArgentinaTourismInfographic";
import ArgentinaTourismTimeline from "@/components/travel/ArgentinaTourismTimeline";
import SteakCutSelector from "@/components/travel/SteakCutSelector";
import SteakDonenessPhrases from "@/components/travel/SteakDonenessPhrases";
import SteakCutDiagram from "@/components/travel/SteakCutDiagram";
import SteakOrderScenarios from "@/components/travel/SteakOrderScenarios";
import SteakBillExplainer from "@/components/travel/SteakBillExplainer";

export type TravelWidgetKey =
  | "season-matrix"
  | "tourism-infographic"
  | "tourism-timeline"
  | "steak-cut-selector"
  | "steak-doneness-phrases"
  | "steak-cut-diagram"
  | "steak-order-scenarios"
  | "steak-bill-explainer";

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

  return null;
}
