import {
  AlertTriangle,
  Calculator,
  Info,
  Lightbulb,
  Megaphone,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
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

const INTERNAL_PATH_RE = /(\/guide\/[a-z0-9-]+(?:#[a-z0-9-]+)?|\/tours|\/contacts|\/immigration)/gi;
const GUIDE_PATH_LABELS: Record<string, string> = {
  "/guide/bezopasnost": "раздел о безопасности",
  "/guide/ekonomika-i-dengi": "раздел о деньгах",
  "/guide/gde-zhit": "раздел о жилье",
  "/guide/kak-dobratsya": "раздел о дороге и въезде",
  "/guide/pogoda-i-sezonnost": "раздел о погоде и сезонах",
  "/guide/svyaz": "раздел о связи",
  "/guide/transport": "раздел о транспорте",
  "/guide/yazyk": "раздел о языке",
  "/tours": "каталог туров",
  "/contacts": "страница контактов",
};

function renderGuideText(value: string): ReactNode[] {
  const normalizedValue = value
    .replace(/forecast yesterday, today and tomorrow/gi, "прогноз на сегодня и ближайшие дни")
    .replace(/\bBuenos Aires\b/g, "Буэнос-Айрес")
    .replace(/\bPatagonia\b/g, "Патагония")
    .replace(/\bIguazú\b/g, "Игуасу")
    .replace(/\bMendoza\b/g, "Мендоса")
    .replace(/\bSalta\b/g, "Сальта")
    .replace(/\bBA\b/g, "Буэнос-Айрес")
    .replace(/\boffline maps?\b/gi, "офлайн-карты")
    .replace(/\bpower bank\b/gi, "внешний аккумулятор")
    .replace(/\bremote work\b/gi, "удалённая работа")
    .replace(/\bmobile data\b/gi, "мобильный интернет")
    .replace(/\bdata\b/gi, "интернет")
    .replace(/\bupload\b/gi, "отдача")
    .replace(/\bcoworking\b/gi, "коворкинг")
    .replace(/\bguesthouse\b/gi, "гостевой дом")
    .replace(/\bhostel\b/gi, "хостел")
    .replace(/\bdorm\b/gi, "общая комната")
    .replace(/\bprivate room\b/gi, "отдельная комната")
    .replace(/\bhotspot\b/gi, "режим модема")
    .replace(/\bwindproof shell\b/gi, "ветрозащитная куртка")
    .replace(/\bbase layer\b/gi, "термобельё")
    .replace(/\bfleece\b/gi, "флисовая кофта")
    .replace(/\bbreathable layers\b/gi, "дышащие слои одежды")
    .replace(/\bshoulder\b/gi, "межсезонье")
    .replace(/\bpremium\b/gi, "премиум")
    .replace(/\bkiosco\b/gi, "киоск")
    .replace(/\bprepago\b/gi, "предоплатный тариф");

  return normalizedValue.split(INTERNAL_PATH_RE).filter(Boolean).map((part, index) => {
    if (!part.startsWith("/")) return part;
    const normalized = part.toLowerCase();
    const href = normalized === "/immigration" ? "/contacts" : part;
    const basePath = normalized.split("#")[0];
    const label =
      normalized === "/immigration"
        ? "консультация по вопросам переезда"
        : GUIDE_PATH_LABELS[basePath] ?? "подробный материал";
    return (
      <Link
        key={`${part}-${index}`}
        href={href}
        className="text-sky-ink underline decoration-sky/35 underline-offset-2 hover:decoration-sky-ink"
      >
        {label}
      </Link>
    );
  });
}

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
          <p className="mt-1.5 text-sm leading-relaxed text-slate">
            {renderGuideText(box.body)}
          </p>
        </div>
      </div>
    </aside>
  );
}

function PillarTableMobileCards({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="mt-5 space-y-3 md:hidden">
      {rows.map((row, rowIndex) => (
        <article
          key={rowIndex}
          className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
        >
          <dl className="space-y-3">
            {headers.map((header, cellIndex) => (
              <div key={`${rowIndex}-${header}`}>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate">{header}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-charcoal">
                  {renderGuideText(row[cellIndex] ?? "")}
                </dd>
              </div>
            ))}
          </dl>
        </article>
      ))}
    </div>
  );
}

function PillarTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <>
      <PillarTableMobileCards headers={headers} rows={rows} />
      <div className="mt-5 hidden overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm md:block">
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
                  {renderGuideText(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </>
  );
}

function ImagePlaceholder() {
  return null;
}

function MapPlaceholder() {
  return null;
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
    <HubSection
      id={section.id}
      title={section.title}
      subtitle={section.content ? renderGuideText(section.content) : undefined}
    >
      {section.subsections?.map((sub) => (
        <div key={sub.title} className="mt-6 first:mt-0">
          <h3 className="font-heading text-lg font-bold text-charcoal">{sub.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate">
            {renderGuideText(sub.body)}
          </p>
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
