const DEFAULT_TOUR_CARD_FALLBACK = "/media/home/hero.jpg";

type TourCardFallbackSource = {
  title: string;
  destination?: string;
  region?: string;
  activityType?: string;
  partnerThematicTags?: readonly string[];
};

const THEMATIC_FALLBACKS: Array<{ terms: string[]; src: string }> = [
  { terms: ["игуасу", "iguazu", "миссионес", "misiones"], src: "/media/tours/iguazu-falls/hero.jpg" },
  { terms: ["мендос", "mendoza", "вино", "wine", "дегустац"], src: "/media/tours/mendoza-wine/hero.jpg" },
  { terms: ["ушуай", "ushuaia", "огненная земля", "tierra del fuego"], src: "/media/tours/ushuaia-end-of-world/hero.jpg" },
  { terms: ["сальт", "salta", "жужуй", "jujuy", "северо-запад"], src: "/media/tours/salta-northwest/hero.jpg" },
  { terms: ["барилоч", "bariloche", "науэль", "nahuel"], src: "/media/tours/bariloche-lakes/hero.jpg" },
  { terms: ["буэнос-айрес", "buenos aires", "танго", "tango"], src: "/media/tours/buenos-aires-tango/hero.jpg" },
  { terms: ["фитц-рой", "fitz roy", "эль-чальтен", "el chalten", "треккинг"], src: "/media/tours/fitz-roy-trek/hero.jpg" },
  { terms: ["патагони", "patagonia", "ледник", "glacier", "калафате", "calafate"], src: "/media/tours/patagonia-glaciers/hero.jpg" },
];

export function resolveTourCardFallbackImage(
  tour: TourCardFallbackSource,
): string {
  const haystack = [
    tour.title,
    tour.destination,
    tour.region,
    tour.activityType,
    ...(tour.partnerThematicTags ?? []),
  ]
    .join(" ")
    .toLocaleLowerCase("ru")
    .replaceAll("ё", "е");

  return THEMATIC_FALLBACKS.find(({ terms }) => terms.some((term) => haystack.includes(term)))?.src
    ?? DEFAULT_TOUR_CARD_FALLBACK;
}
