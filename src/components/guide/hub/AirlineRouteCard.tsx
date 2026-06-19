import { ArrowRightLeft, Fuel, Info, Link2, MapPin } from "lucide-react";
import AirlineLogo from "@/components/guide/hub/AirlineLogo";
import { cn } from "@/lib/cn";
import type { TravelHubAirline, TravelHubAirlineNoteType } from "@/types/guide-travel-hub";

const noteMeta: Record<
  TravelHubAirlineNoteType,
  { icon: typeof Info; label: string; className: string }
> = {
  info: { icon: Info, label: "Справка", className: "text-slate" },
  "tech-stop": { icon: Fuel, label: "Техпосадка", className: "text-amber-700" },
  connection: { icon: Link2, label: "Стыковка", className: "text-sky" },
  "from-russia": { icon: MapPin, label: "Из РФ", className: "text-patagonia" },
  hub: { icon: ArrowRightLeft, label: "Хаб", className: "text-slate" },
};

type AirlineRouteCardProps = {
  airline: TravelHubAirline;
};

export default function AirlineRouteCard({ airline }: AirlineRouteCardProps) {
  return (
    <article className="flex h-full flex-col rounded-xl border border-gray-100 bg-white p-3.5 shadow-sm">
      <div className="flex items-start gap-2.5">
        <AirlineLogo name={airline.name} size="md" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-snug text-charcoal">{airline.name}</p>
          <p className="mt-1.5 text-xs font-medium leading-relaxed text-charcoal">{airline.route}</p>
        </div>
      </div>

      {airline.notes?.length ? (
        <ul className="mt-3 space-y-1.5 border-t border-gray-50 pt-2.5">
          {airline.notes.map((note) => {
            const type = note.type ?? "info";
            const meta = noteMeta[type];
            const Icon = meta.icon;

            return (
              <li key={note.text} className="flex items-start gap-1.5 text-[11px] leading-snug">
                <Icon className={cn("mt-0.5 h-3 w-3 shrink-0", meta.className)} aria-hidden />
                <span className={cn("text-slate", type === "tech-stop" && "text-amber-800/90")}>
                  {note.text}
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </article>
  );
}
