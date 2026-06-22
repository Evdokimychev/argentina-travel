import GuidePillarFaq from "@/components/guide/GuidePillarFaq";
import type { PlaceDetail } from "@/types/place";

export default function PlaceDetailContentSections({ place }: { place: PlaceDetail }) {
  const hasExtended =
    place.history ||
    (place.interestingFacts && place.interestingFacts.length > 0) ||
    (place.nearbyHighlights && place.nearbyHighlights.length > 0) ||
    (place.faq && place.faq.length > 0);

  if (!hasExtended) return null;

  return (
    <div className="space-y-8">
      {place.history ? (
        <section>
          <h2 className="font-heading text-xl font-bold text-charcoal">История</h2>
          <p className="mt-3 text-base leading-relaxed text-charcoal">{place.history}</p>
        </section>
      ) : null}

      {place.interestingFacts && place.interestingFacts.length > 0 ? (
        <section>
          <h2 className="font-heading text-xl font-bold text-charcoal">Интересные факты</h2>
          <ul className="mt-3 space-y-2">
            {place.interestingFacts.map((fact) => (
              <li
                key={fact}
                className="rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm leading-relaxed text-charcoal"
              >
                {fact}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {place.nearbyHighlights && place.nearbyHighlights.length > 0 ? (
        <section>
          <h2 className="font-heading text-xl font-bold text-charcoal">Что посмотреть рядом</h2>
          <ul className="mt-3 list-inside list-disc space-y-1 text-sm leading-relaxed text-charcoal">
            {place.nearbyHighlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {place.faq && place.faq.length > 0 ? (
        <section>
          <h2 className="font-heading text-xl font-bold text-charcoal">Частые вопросы</h2>
          <div className="mt-4">
            <GuidePillarFaq items={place.faq} />
          </div>
        </section>
      ) : null}
    </div>
  );
}
