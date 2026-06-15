import type { EsimOffer, EsimCatalogSummary } from "@/lib/airalo/types";

export type EsimOfferMeta = {
  region?: string;
  area?: string;
  planType?: string;
  dataLabel?: string;
  dataGb?: number | null;
  isUnlimited?: boolean;
  validityDays?: number;
  planSlug?: string;
  pricePerDay?: number;
  inStock?: boolean;
  isBundle?: boolean;
};

function capitalizeWords(value: string): string {
  return value
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function extractPlanSlugFromUrl(purchaseUrl: string): string | undefined {
  try {
    const destination = new URL(purchaseUrl).searchParams.get("u");
    const pathname = new URL(destination ?? purchaseUrl).pathname;
    const segment = pathname.split("/").filter(Boolean).pop();
    return segment?.trim() || undefined;
  } catch {
    return undefined;
  }
}

export function extractPlanSlugFromMpn(mpn?: string): string | undefined {
  if (!mpn?.trim()) return undefined;
  const normalized = mpn.trim().toLowerCase();
  if (!normalized.startsWith("esim-")) return undefined;
  return normalized.slice("esim-".length) || undefined;
}

/** Airalo migrated many slugs to `{brand}-in-{days}days-{gb}gb`. */
export function modernizeAiraloPlanSlug(planSlug: string): string {
  const normalized = planSlug.trim().toLowerCase();
  if (normalized.includes("-in-")) return normalized;

  const match = normalized.match(/^(.+?)-(\d+)days-(.+)$/);
  if (!match) return normalized;

  const [, brandPart, days, rest] = match;
  return `${brandPart}-in-${days}days-${rest}`;
}

export function buildAiraloPlanSlugCandidates(offer: Pick<
  EsimOffer,
  "planSlug" | "brand" | "networkLabel" | "dataGb" | "validityDays" | "mpn"
>): string[] {
  const brand = (offer.brand ?? offer.networkLabel ?? "abrazo").trim().toLowerCase();
  const gb = offer.dataGb;
  const days = offer.validityDays;
  const candidates: string[] = [];

  const add = (slug?: string) => {
    const normalized = slug?.trim().toLowerCase();
    if (normalized) candidates.push(normalized);
  };

  add(offer.planSlug);
  add(extractPlanSlugFromMpn(offer.mpn));
  if (offer.planSlug) add(modernizeAiraloPlanSlug(offer.planSlug));
  if (offer.mpn) {
    const fromMpn = extractPlanSlugFromMpn(offer.mpn);
    if (fromMpn) add(modernizeAiraloPlanSlug(fromMpn));
  }

  if (gb != null && days) {
    add(`${brand}-in-${days}days-${gb}gb`);
    add(`${brand}-${days}days-${gb}gb`);
  }

  if (gb != null) {
    const validityOptions = [3, 7, 15, 30].sort(
      (a, b) => Math.abs(a - (days ?? 7)) - Math.abs(b - (days ?? 7))
    );
    for (const validity of validityOptions) {
      add(`${brand}-in-${validity}days-${gb}gb`);
    }
  }

  return [...new Set(candidates)];
}

export function buildAiraloProductUrl(countrySlug: string, planSlug: string): string {
  const country = countrySlug.trim().replace(/^\/+|\/+$/g, "");
  const slug = planSlug.trim().replace(/^\/+|\/+$/g, "");
  return `https://www.airalo.com/${country}-esim/${slug}`;
}

function parseDataAmount(raw?: string): { label?: string; gb: number | null; isUnlimited: boolean } {
  if (!raw?.trim()) return { gb: null, isUnlimited: false };

  const normalized = raw.trim().toLowerCase();
  if (normalized.includes("unlimited")) {
    return { label: "Unlimited", gb: null, isUnlimited: true };
  }

  const match = normalized.match(/([\d.]+)\s*gb/);
  if (match) {
    const gb = Number.parseFloat(match[1]);
    return {
      label: `${match[1]} GB`,
      gb: Number.isFinite(gb) ? gb : null,
      isUnlimited: false,
    };
  }

  return { label: capitalizeWords(raw), gb: null, isUnlimited: false };
}

function parseValidityDays(raw?: string, title?: string): number | undefined {
  if (raw?.trim()) {
    const match = raw.trim().toLowerCase().match(/(\d+)\s*day/);
    if (match) return Number.parseInt(match[1], 10);
  }

  if (title) {
    const match = title.match(/valid for\s+(\d+)\s+days?/i);
    if (match) return Number.parseInt(match[1], 10);
  }

  return undefined;
}

export function parseProductType(productType?: string): Partial<EsimOfferMeta> {
  if (!productType?.trim()) return {};

  const parts = productType.split(">").map((part) => part.trim()).filter(Boolean);
  if (parts.length < 2) return {};

  const region = parts[1];
  const area = parts[2];
  const planType = parts[3];
  const dataRaw = parts[4];
  const validityRaw = parts[5];

  const data = parseDataAmount(dataRaw);

  return {
    region: region ? capitalizeWords(region) : undefined,
    area: area ? capitalizeWords(area) : undefined,
    planType: planType ? capitalizeWords(planType) : undefined,
    dataLabel: data.label,
    dataGb: data.gb,
    isUnlimited: data.isUnlimited,
    validityDays: parseValidityDays(validityRaw),
  };
}

export function parseTitleMeta(title: string): Partial<EsimOfferMeta> {
  const unlimited = /unlimited/i.test(title);
  const dataMatch = title.match(/([\d.]+)\s*GB/i);
  const validityMatch = title.match(/valid for\s+(\d+)\s+days?/i);

  return {
    dataLabel: unlimited ? "Unlimited" : dataMatch ? `${dataMatch[1]} GB` : undefined,
    dataGb: dataMatch ? Number.parseFloat(dataMatch[1]) : unlimited ? null : undefined,
    isUnlimited: unlimited,
    validityDays: validityMatch ? Number.parseInt(validityMatch[1], 10) : undefined,
  };
}

export function enrichEsimOfferMeta(offer: EsimOffer): EsimOffer {
  const fromType = parseProductType(offer.productType);
  const fromTitle = parseTitleMeta(offer.title);
  const planSlug = extractPlanSlugFromUrl(offer.purchaseUrl);
  const displayPrice = offer.salePrice ?? offer.price;
  const validityDays = fromType.validityDays ?? fromTitle.validityDays;
  const pricePerDay =
    validityDays && validityDays > 0 ? Math.round((displayPrice / validityDays) * 100) / 100 : undefined;

  return {
    ...offer,
    region: fromType.region,
    area: fromType.area,
    planType: fromType.planType ?? "Data",
    dataLabel: fromType.dataLabel ?? fromTitle.dataLabel,
    dataGb: fromType.dataGb ?? fromTitle.dataGb ?? null,
    isUnlimited: fromType.isUnlimited ?? fromTitle.isUnlimited ?? false,
    validityDays,
    planSlug,
    pricePerDay,
    mpn: offer.mpn,
    inStock: offer.availability?.toLowerCase().includes("in stock") ?? true,
    isBundle: offer.isBundle ?? false,
    networkLabel: offer.brand ? capitalizeWords(offer.brand) : undefined,
  };
}

export function summarizeEsimOffers(offers: EsimOffer[]): EsimCatalogSummary {
  if (!offers.length) {
    return { count: 0, currency: "USD", hasUnlimited: false, networks: [], regions: [] };
  }

  const prices = offers.map((offer) => offer.salePrice ?? offer.price);
  const dataValues = offers
    .map((offer) => offer.dataGb)
    .filter((value): value is number => value != null && Number.isFinite(value));
  const validityValues = offers
    .map((offer) => offer.validityDays)
    .filter((value): value is number => value != null && Number.isFinite(value));

  const networks = [...new Set(offers.map((offer) => offer.networkLabel).filter(Boolean))] as string[];
  const regions = [...new Set(offers.map((offer) => offer.region).filter(Boolean))] as string[];

  return {
    count: offers.length,
    minPrice: Math.min(...prices),
    maxPrice: Math.max(...prices),
    currency: offers[0]?.currency ?? "USD",
    minDataGb: dataValues.length ? Math.min(...dataValues) : null,
    maxDataGb: dataValues.length ? Math.max(...dataValues) : null,
    hasUnlimited: offers.some((offer) => offer.isUnlimited),
    validityRange: validityValues.length
      ? { min: Math.min(...validityValues), max: Math.max(...validityValues) }
      : undefined,
    networks,
    regions,
  };
}

export type EsimDataFilter = "all" | "unlimited" | "limited";

export type EsimOfferFilters = {
  dataType?: EsimDataFilter;
  dataGb?: number;
  validityDays?: number;
  planType?: string;
};

export function filterEsimOffers(offers: EsimOffer[], filters: EsimOfferFilters): EsimOffer[] {
  return offers.filter((offer) => {
    if (filters.dataType === "unlimited" && !offer.isUnlimited) return false;
    if (filters.dataType === "limited" && offer.isUnlimited) return false;
    if (filters.dataGb != null) {
      if (offer.isUnlimited || offer.dataGb !== filters.dataGb) return false;
    }
    if (filters.validityDays != null && offer.validityDays !== filters.validityDays) return false;
    if (filters.planType && offer.planType !== filters.planType) return false;
    return true;
  });
}

export function buildEsimFilterOptions(offers: EsimOffer[]) {
  const dataGb = [...new Set(offers.filter((o) => !o.isUnlimited && o.dataGb != null).map((o) => o.dataGb!))].sort(
    (a, b) => a - b
  );
  const validityDays = [...new Set(offers.map((o) => o.validityDays).filter((v): v is number => v != null))].sort(
    (a, b) => a - b
  );
  const planTypes = [...new Set(offers.map((o) => o.planType).filter(Boolean))] as string[];
  const hasUnlimited = offers.some((o) => o.isUnlimited);
  const hasLimited = offers.some((o) => !o.isUnlimited);

  return { dataGb, validityDays, planTypes, hasUnlimited, hasLimited };
}

export function sortEsimOffers(
  offers: EsimOffer[],
  sort: "price_asc" | "price_desc" | "data_desc" | "validity_desc" | "price_per_day"
): EsimOffer[] {
  const copy = [...offers];
  copy.sort((a, b) => {
    const priceA = a.salePrice ?? a.price;
    const priceB = b.salePrice ?? b.price;
    const dataA = a.isUnlimited ? Number.MAX_SAFE_INTEGER : (a.dataGb ?? 0);
    const dataB = b.isUnlimited ? Number.MAX_SAFE_INTEGER : (b.dataGb ?? 0);
    const validityA = a.validityDays ?? 0;
    const validityB = b.validityDays ?? 0;
    const ppdA = a.pricePerDay ?? Number.MAX_SAFE_INTEGER;
    const ppdB = b.pricePerDay ?? Number.MAX_SAFE_INTEGER;

    switch (sort) {
      case "price_desc":
        return priceB - priceA;
      case "data_desc":
        return dataB - dataA;
      case "validity_desc":
        return validityB - validityA;
      case "price_per_day":
        return ppdA - ppdB;
      default:
        return priceA - priceB;
    }
  });
  return copy;
}
