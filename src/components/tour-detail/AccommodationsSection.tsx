import Image from "next/image";
import { TourAccommodation } from "@/types";
import TourSection from "./TourSection";

export default function AccommodationsSection({
  accommodations,
}: {
  accommodations: TourAccommodation[];
}) {
  return (
    <TourSection id="accommodations" title="Проживание" subtitle="Варианты размещения по маршруту">
      <div className="space-y-6">
        {accommodations.map((acc) => (
          <article
            key={acc.id}
            className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
          >
            <div className="grid md:grid-cols-2">
              <div className="relative h-48 md:h-auto md:min-h-[220px]">
                <Image
                  src={acc.images[0]}
                  alt={acc.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <div className="p-5 sm:p-6">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-charcoal">{acc.name}</h3>
                  <span className="rounded-full bg-sky/10 px-3 py-1 text-xs font-medium text-sky">
                    {acc.comfort}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate">{acc.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {acc.amenities.map((a) => (
                    <span
                      key={a}
                      className="rounded-lg bg-surface-muted px-2.5 py-1 text-xs text-slate"
                    >
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </TourSection>
  );
}
