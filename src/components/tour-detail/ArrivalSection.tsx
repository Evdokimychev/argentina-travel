import { TourArrivalInfo } from "@/types";
import { SectionHeading } from "./InfoModal";

export default function ArrivalSection({ arrival }: { arrival: TourArrivalInfo }) {
  return (
    <section id="arrival" className="scroll-mt-32">
      <SectionHeading title="Как добраться" />
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <h4 className="text-sm font-semibold text-charcoal">Аэропорты</h4>
            <ul className="mt-2 space-y-1 text-sm text-slate">
              {arrival.airports.map((a) => (
                <li key={a}>✈ {a}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-charcoal">Рекомендуемые рейсы</h4>
            <ul className="mt-2 space-y-1 text-sm text-slate">
              {arrival.flights.map((f) => (
                <li key={f}>• {f}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-charcoal">Трансферы</h4>
            <ul className="mt-2 space-y-1 text-sm text-slate">
              {arrival.transfers.map((t) => (
                <li key={t}>• {t}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-charcoal">Место встречи</h4>
            <p className="mt-2 text-sm text-slate">{arrival.meetingPoint}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ImportantSection({ items }: { items: string[] }) {
  return (
    <section id="important" className="scroll-mt-32">
      <SectionHeading title="Важно знать" />
      <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-6">
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item} className="flex gap-3 text-sm text-charcoal">
              <span className="text-amber-500">⚠</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
