import { DESTINATION_PAGES, getDestinationPageById } from "@/data/destination-pages";
import { destinationCatalogHref } from "@/lib/site-nav";
import { isArgentinaHomepageTour } from "@/lib/homepage-tours";
import type { DestinationPage } from "@/data/destination-pages";
import type { TourListing } from "@/types";

export { destinationCatalogHref };

export function getAllDestinations(): DestinationPage[] {
  return DESTINATION_PAGES;
}

export function getDestinationBySlug(slug: string): DestinationPage | undefined {
  return getDestinationPageById(slug);
}

export function destinationHref(id: string): string {
  return `/destinations/${id}`;
}

const OTHER_COUNTRY_PATTERN =
  /(?:^|\s)(?:бразил|brazil|парагва|paraguay|рио[- ]?де[- ]?жaneiro|amazon|амазон|карнавал\s+в\s+рио)/i;

type DestinationMatchConfig = {
  terms: string[];
  block?: RegExp[];
};

const DESTINATION_MATCH: Record<string, DestinationMatchConfig> = {
  ba: {
    terms: [
      "buenos",
      "буэнос",
      "palermo",
      "recoleta",
      "san telmo",
      "la boca",
      "puerto madero",
      "tigre",
    ],
  },
  bariloche: {
    terms: ["bariloche", "барилоч", "nahuel", "науэль", "catedral", "tronador", "campanario"],
  },
  calafate: {
    terms: [
      "calafate",
      "калафат",
      "perito",
      "перито",
      "moreno",
      "glaciar",
      "los glaciares",
      "upsala",
      "spegazzini",
    ],
  },
  ushuaia: {
    terms: ["ushuaia", "ушуай", "beagle", "бигль", "tierra del fuego", "огнен", "esmeralda"],
  },
  iguazu: {
    terms: ["iguaz", "игуас", "garganta", "puerto iguaz", "misiones", "игуасу"],
    block: [/бразил/i, /brazil/i, /парагва/i, /paraguay/i, /amazon/i, /амазон/i, /карнавал/i],
  },
  mendoza: {
    terms: ["mendoza", "мендос", "malbec", "maipú", "maipu", "uco", "aconcagua", "вин"],
    block: [/бразил/i, /brazil/i, /парагва/i, /paraguay/i, /карнавал/i, /amazon/i, /амазон/i],
  },
  salta: {
    terms: [
      "salta",
      "сальт",
      "cafayate",
      "humahuaca",
      "purmamarca",
      "jujuy",
      "жужуй",
      "tren a las nubes",
      "conchas",
    ],
  },
  patagonia: {
    terms: [
      "patagon",
      "патагон",
      "calafate",
      "bariloche",
      "ushuaia",
      "chaltén",
      "chalten",
      "perito",
      "fitz",
      "valdés",
      "valdes",
      "glaciar",
      "ледник",
      "torres",
    ],
  },
};

export function matchToursForDestination(
  tours: TourListing[],
  destination: DestinationPage
): TourListing[] {
  const config = DESTINATION_MATCH[destination.id];
  const defaultTerms = [destination.name, destination.region, ...destination.keywords].map((term) =>
    term.toLowerCase()
  );
  const terms = config?.terms ?? defaultTerms;
  const block = config?.block ?? [];

  return tours.filter((tour) => {
    if (!isArgentinaHomepageTour(tour)) return false;

    const haystack = [
      tour.title,
      tour.destination,
      tour.region,
      tour.shortDescription,
      tour.activityType,
    ]
      .join(" ")
      .toLowerCase();

    const hasTerm = terms.some((term) => haystack.includes(term.toLowerCase()));
    if (!hasTerm) return false;

    if (
      OTHER_COUNTRY_PATTERN.test(haystack) &&
      !/(?:аргентин|argentina)/i.test(haystack)
    ) {
      return false;
    }

    if (block.some((pattern) => pattern.test(haystack))) {
      const anchoredInArgentina =
        /(?:аргентин|argentina|iguaz|игуас|misiones|mendoza|мендос|puerto iguaz)/i.test(
          haystack
        );
      if (!anchoredInArgentina) return false;
    }

    return true;
  });
}

export function destinationCatalogLink(destination: DestinationPage): string {
  return destinationCatalogHref(destination.name);
}
