import {
  AlertTriangle,
  Calculator,
  Info,
  Lightbulb,
  MapPin,
  Megaphone,
  Sparkles,
} from "lucide-react";
import GuideWidgetSlot from "@/components/guide/GuideWidgetSlot";
import HubSection from "@/components/guide/hub/HubSection";
import { cn } from "@/lib/cn";
import type {
  GuidePillarInfoBox,
  GuidePillarInfoBoxVariant,
  GuidePillarSection,
} from "@/types/guide-pillar";

const INFO_BOX_STYLES: Record<
  GuidePillarInfoBoxVariant,
  { border: string; bg: string; icon: typeof Lightbulb; iconClass: string }
> = {
  tip: {
    border: "border-sky/20",
    bg: "bg-sky/5",
    icon: Lightbulb,
    iconClass: "text-sky",
  },
  warning: {
    border: "border-amber-200/80",
    bg: "bg-amber-50/50",
    icon: AlertTriangle,
    iconClass: "text-amber-600",
  },
  info: {
    border: "border-gray-200",
    bg: "bg-surface-muted/60",
    icon: Info,
    iconClass: "text-slate",
  },
};

function InfoBox({ box }: { box: GuidePillarInfoBox }) {
  const style = INFO_BOX_STYLES[box.variant];
  const Icon = style.icon;

  return (
    <aside
      className={cn(
        "rounded-2xl border p-4 shadow-sm sm:p-5",
        style.border,
        style.bg
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", style.iconClass)} aria-hidden />
        <div>
          <p className="font-heading text-sm font-bold text-charcoal">{box.title}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-slate">{box.body}</p>
        </div>
      </div>
    </aside>
  );
}

function PillarTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="mt-5 overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full min-w-[480px] text-left text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-surface-muted/60">
            {headers.map((header) => (
              <th
                key={header}
                scope="col"
                className="px-4 py-3 font-heading font-bold text-charcoal"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b border-gray-50 last:border-0">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-3 text-slate">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ImagePlaceholder({ caption }: { caption?: string }) {
  return (
    <figure className="mt-5 overflow-hidden rounded-2xl border border-dashed border-gray-200 bg-surface-muted/40">
      <div className="flex aspect-[16/9] items-center justify-center px-6 text-center">
        <p className="text-sm text-slate">{caption ?? "Фото — скоро"}</p>
      </div>
    </figure>
  );
}

function MapPlaceholder() {
  return (
    <div className="mt-5 flex aspect-[16/9] items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-surface-muted/40">
      <div className="flex items-center gap-2 text-sm text-slate">
        <MapPin className="h-4 w-4" aria-hidden />
        Интерактивная карта — скоро
      </div>
    </div>
  );
}

type GuidePillarSectionProps = {
  section: GuidePillarSection;
  showMapPlaceholder?: boolean;
  showImagePlaceholder?: boolean;
  initialTours?: import("@/types").TourListing[];
};

export default function GuidePillarSectionBlock({
  section,
  showMapPlaceholder,
  showImagePlaceholder,
  initialTours,
}: GuidePillarSectionProps) {
  return (
    <HubSection id={section.id} title={section.title} subtitle={section.content}>
      {section.subsections?.map((sub) => (
        <div key={sub.title} className="mt-6 first:mt-0">
          <h3 className="font-heading text-lg font-bold text-charcoal">{sub.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate">{sub.body}</p>
        </div>
      ))}
      {section.table ? (
        <PillarTable headers={section.table.headers} rows={section.table.rows} />
      ) : null}
      {showImagePlaceholder ? <ImagePlaceholder /> : null}
      {showMapPlaceholder ? <MapPlaceholder /> : null}
      {section.infoBoxes && section.infoBoxes.length > 0 ? (
        <div className="mt-5 space-y-4">
          {section.infoBoxes.map((box) => (
            <InfoBox key={box.title} box={box} />
          ))}
        </div>
      ) : null}
      {section.widgetSlot ? (
        <div className="mt-5">
          <GuideWidgetSlot slot={section.widgetSlot} initialTours={initialTours} />
        </div>
      ) : null}
    </HubSection>
  );
}

export { Calculator, Megaphone, Sparkles };
