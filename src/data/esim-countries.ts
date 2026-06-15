import type { EsimCountry } from "@/lib/airalo/types";

export const ESIM_COUNTRIES: EsimCountry[] = [
  {
    id: "argentina",
    slug: "argentina",
    nameKey: "esim.countries.argentina",
    keywords: ["argentina", "аргентин"],
  },
  {
    id: "chile",
    slug: "chile",
    nameKey: "esim.countries.chile",
    keywords: ["chile", "чили"],
  },
  {
    id: "uruguay",
    slug: "uruguay",
    nameKey: "esim.countries.uruguay",
    keywords: ["uruguay", "уругв"],
  },
  {
    id: "brazil",
    slug: "brazil",
    nameKey: "esim.countries.brazil",
    keywords: ["brazil", "бразил"],
  },
  {
    id: "latin-america",
    slug: "latin-america",
    nameKey: "esim.countries.latinAmerica",
    keywords: ["latin america", "latam", "latin-america", "latamlink", "латин"],
  },
  {
    id: "global",
    slug: "global",
    nameKey: "esim.countries.global",
    keywords: ["global (international)", "global-esim", "discover"],
  },
];

export const DEFAULT_ESIM_COUNTRY_ID = "argentina";

export function getEsimCountryById(id: string): EsimCountry | undefined {
  return ESIM_COUNTRIES.find((country) => country.id === id);
}
