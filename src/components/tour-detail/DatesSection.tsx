"use client";

import { TourDatePrice } from "@/types";
import FormattedPrice from "@/components/FormattedPrice";
import { formatDateShort } from "@/lib/utils";
import { formatSpots } from "@/lib/pluralize";
import { SectionHeading } from "./InfoModal";
import { useTourBooking } from "./TourBookingContext";

export default function DatesSection({ dates }: { dates: TourDatePrice[] }) {
  const { selectedDateId, setSelectedDateId } = useTourBooking();

  return (
    <section id="dates" className="scroll-mt-32">
      <SectionHeading title="Даты и цены" subtitle="Выберите подходящую дату отправления" />
      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full min-w-[540px] text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-pampas/50">
              <th className="px-5 py-3 font-medium text-slate">Начало</th>
              <th className="px-5 py-3 font-medium text-slate">Окончание</th>
              <th className="px-5 py-3 font-medium text-slate">Мест</th>
              <th className="px-5 py-3 font-medium text-slate">Цена</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {dates.map((d) => (
              <tr
                key={d.id}
                className={`border-b border-gray-50 transition-colors ${
                  selectedDateId === d.id ? "bg-sky/5" : "hover:bg-gray-50"
                }`}
              >
                <td className="px-5 py-4 font-medium text-charcoal">
                  {formatDateShort(d.startDate)}
                </td>
                <td className="px-5 py-4 text-slate">{formatDateShort(d.endDate)}</td>
                <td className="px-5 py-4">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      d.spotsLeft <= 3
                        ? "bg-wine/10 text-wine"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {formatSpots(d.spotsLeft)}
                  </span>
                </td>
                <td className="px-5 py-4 font-semibold text-charcoal">
                  <FormattedPrice priceUsd={d.priceUsd} className="font-semibold text-charcoal" />
                </td>
                <td className="px-5 py-4">
                  <button
                    type="button"
                    onClick={() => setSelectedDateId(d.id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                      selectedDateId === d.id
                        ? "bg-patagonia text-white"
                        : "border border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    Выбрать
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
