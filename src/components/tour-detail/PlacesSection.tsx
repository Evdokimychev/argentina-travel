import Image from "next/image";
import { TourPlace } from "@/types";
import { SectionHeading } from "./InfoModal";

export default function PlacesSection({ places }: { places: TourPlace[] }) {
  return (
    <section id="places" className="tour-section-target">
      <SectionHeading title="Главные впечатления" subtitle="Уникальные моменты тура" />
      <div className="grid gap-4 sm:grid-cols-2">
        {places.map((place) => (
          <article
            key={place.id}
            className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-lg"
          >
            <div className="relative h-48 overflow-hidden">
              <Image
                src={place.image}
                alt={place.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            <div className="p-5">
              <h3 className="font-semibold text-charcoal">{place.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate">{place.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
