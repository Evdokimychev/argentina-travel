import ArgentinaSeasonMatrix from "@/components/travel/ArgentinaSeasonMatrix";
import ArgentinaTourismInfographic from "@/components/travel/ArgentinaTourismInfographic";
import ArgentinaTourismTimeline from "@/components/travel/ArgentinaTourismTimeline";

export type TravelWidgetKey = "season-matrix" | "tourism-infographic" | "tourism-timeline";

type Props = {
  widgetKey: string;
  className?: string;
  title?: string;
};

/** Рендер встроенных редакционных виджетов по ключу. */
export default function TravelWidgetRenderer({ widgetKey, className, title }: Props) {
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

  if (!key) return null;

  return (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-surface-muted/40 px-4 py-5 text-sm">
      <p className="font-medium text-charcoal">{title?.trim() || "Виджет"}</p>
      <p className="mt-1 font-mono text-xs text-slate">widget: {key}</p>
    </div>
  );
}
