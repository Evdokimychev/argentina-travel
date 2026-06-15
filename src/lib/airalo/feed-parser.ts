import type { EsimOffer } from "@/lib/airalo/types";
import { enrichEsimOfferMeta } from "@/lib/airalo/offer-meta";

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function readTagValue(block: string, tag: string): string | undefined {
  const patterns = [
    new RegExp(`<g:${tag}[^>]*>([\\s\\S]*?)<\\/g:${tag}>`, "i"),
    new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"),
  ];

  for (const pattern of patterns) {
    const match = block.match(pattern);
    if (match?.[1]) {
      const raw = match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, "$1").trim();
      if (raw) return decodeXmlEntities(raw);
    }
  }

  return undefined;
}

function parsePriceValue(raw: string | undefined): { amount?: number; currency?: string } {
  if (!raw?.trim()) return {};

  const normalized = raw.trim().replace(/,/g, "");
  const match = normalized.match(/^([\d.]+)\s*([A-Z]{3})$/i);
  if (match) {
    const amount = Number.parseFloat(match[1]);
    return {
      amount: Number.isFinite(amount) ? amount : undefined,
      currency: match[2].toUpperCase(),
    };
  }

  const amountOnly = Number.parseFloat(normalized);
  if (Number.isFinite(amountOnly)) {
    return { amount: amountOnly };
  }

  return {};
}

export function extractDestinationUrl(affiliateLink: string): string | undefined {
  try {
    const url = new URL(affiliateLink);
    const destination = url.searchParams.get("u");
    if (destination) return destination;
  } catch {
    /* ignore invalid URLs */
  }

  return undefined;
}

function extractCountrySlugFromUrl(url: string): string | undefined {
  try {
    const pathname = new URL(url).pathname.replace(/^\/+|\/+$/g, "");
    const segment = pathname.split("/").find((part) => part.endsWith("-esim"));
    if (segment) return segment.replace(/-esim$/, "");
  } catch {
    /* ignore invalid URLs */
  }

  return undefined;
}

function extractCountrySlugFromProductType(productType?: string): string | undefined {
  if (!productType) return undefined;

  const parts = productType.split(">").map((part) => part.trim().toLowerCase());
  if (parts.length < 3) return undefined;

  const country = parts[2];
  return country.replace(/\s+/g, "-");
}

function extractCountrySlug(link: string, title: string, productType?: string): string | undefined {
  const destinationUrl = extractDestinationUrl(link) ?? link;
  const fromUrl = extractCountrySlugFromUrl(destinationUrl);
  if (fromUrl) return fromUrl;

  const fromProductType = extractCountrySlugFromProductType(productType);
  if (fromProductType) return fromProductType;

  const titleMatch = title.match(/\b([A-Za-z][A-Za-z\s()-]{1,40}?)\s+travel\s+eSIM/i);
  if (titleMatch?.[1]) {
    const name = titleMatch[1].trim();
    if (/latin america/i.test(name)) return "latin-america";
    if (/global/i.test(name)) return "global";
    return name.toLowerCase().replace(/\s+/g, "-");
  }

  return undefined;
}

function mapFeedItem(block: string): EsimOffer | null {
  const id = readTagValue(block, "id");
  const title = readTagValue(block, "title");
  const purchaseUrl = readTagValue(block, "link");

  if (!id || !title || !purchaseUrl) return null;

  const productType = readTagValue(block, "product_type");
  const priceRaw = parsePriceValue(readTagValue(block, "price"));
  const saleRaw = parsePriceValue(readTagValue(block, "sale_price"));
  const basePrice = priceRaw.amount ?? saleRaw.amount;
  const salePrice = saleRaw.amount;

  if (basePrice == null) return null;

  return enrichEsimOfferMeta({
    id,
    title,
    description: readTagValue(block, "description"),
    purchaseUrl,
    imageUrl: readTagValue(block, "image_link"),
    price: basePrice,
    salePrice: salePrice != null && salePrice < basePrice ? salePrice : undefined,
    currency: saleRaw.currency ?? priceRaw.currency ?? "USD",
    brand: readTagValue(block, "brand"),
    availability: readTagValue(block, "availability"),
    productType,
    countrySlug: extractCountrySlug(purchaseUrl, title, productType),
    mpn: readTagValue(block, "mpn"),
    isBundle: readTagValue(block, "is_bundle")?.toLowerCase() === "true",
  });
}

export function parseAiraloFeedXml(xml: string): EsimOffer[] {
  const items = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];
  const offers: EsimOffer[] = [];

  for (const block of items) {
    const offer = mapFeedItem(block);
    if (offer) offers.push(offer);
  }

  return offers;
}
