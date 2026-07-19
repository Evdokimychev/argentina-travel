import type { ApartmentDraftInput, ApartmentImageInput } from "@/types/apartments";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MARKET = /^[a-z][a-z0-9_-]{1,31}$/;
const COUNTRY = /^[A-Z]{2}$/;
const CURRENCY = /^[A-Z]{3}$/;

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function integer(value: unknown, min: number, max: number): number | null {
  return Number.isInteger(value) && Number(value) >= min && Number(value) <= max
    ? Number(value)
    : null;
}

function number(value: unknown, min: number, max: number): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max
    ? value
    : null;
}

function strings(value: unknown, limit: number): string[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, limit).map((item) => text(item, 160)).filter(Boolean);
}

function parseImages(value: unknown): ApartmentImageInput[] | null {
  if (!Array.isArray(value) || value.length > 30) return null;
  const images = value.map((raw, index) => {
    const row = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
    return {
      mediaRef: text(row.mediaRef, 1000),
      altText: text(row.altText, 240),
      rightsHolder: text(row.rightsHolder, 240),
      rightsSourceUrl: text(row.rightsSourceUrl, 1000) || null,
      licenseCode: text(row.licenseCode, 80),
      position: integer(row.position, 0, 1000) ?? index,
    };
  });
  if (images.some((image) => !image.mediaRef || image.altText.length < 3 || image.rightsHolder.length < 2 || image.licenseCode.length < 2)) return null;
  if (images.some((image) => image.rightsSourceUrl && !image.rightsSourceUrl.startsWith("https://"))) return null;
  return images;
}

export function parseApartmentDraftInput(value: unknown):
  | { ok: true; value: ApartmentDraftInput }
  | { ok: false; error: string } {
  const row = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const marketId = text(row.marketId, 32);
  const countryCode = text(row.countryCode, 2).toUpperCase();
  const slug = text(row.slug, 140).toLowerCase();
  const currency = text(row.currency, 3).toUpperCase();
  const title = text(row.title, 160);
  const summary = text(row.summary, 500);
  const description = text(row.description, 12000);
  const locality = text(row.locality, 120);
  const region = text(row.region, 120);
  const propertyTimezone = text(row.propertyTimezone, 80);
  const exactAddress = text(row.exactAddress, 500);
  const maxGuests = integer(row.maxGuests, 1, 40);
  const bedrooms = integer(row.bedrooms, 0, 20);
  const beds = integer(row.beds, 1, 40);
  const bathrooms = number(row.bathrooms, 0.5, 20);
  const nightlyPriceMinor = integer(row.nightlyPriceMinor, 1, Number.MAX_SAFE_INTEGER);
  const minimumStayNights = integer(row.minimumStayNights, 1, 365);
  const depositMinor = row.depositMinor === null || row.depositMinor === "" || row.depositMinor === undefined
    ? null : integer(row.depositMinor, 0, Number.MAX_SAFE_INTEGER);
  const depositDisclosure = text(row.depositDisclosure, 500);
  const publicLatitude = row.publicLatitude === null || row.publicLatitude === "" || row.publicLatitude === undefined
    ? null : number(row.publicLatitude, -90, 90);
  const publicLongitude = row.publicLongitude === null || row.publicLongitude === "" || row.publicLongitude === undefined
    ? null : number(row.publicLongitude, -180, 180);
  const images = parseImages(row.images);
  if (!MARKET.test(marketId) || !COUNTRY.test(countryCode) || !SLUG.test(slug) || !CURRENCY.test(currency)) return { ok: false, error: "Проверьте рынок, страну, адрес страницы и валюту." };
  if (title.length < 3 || locality.length < 2 || region.length < 2 || propertyTimezone.length < 3 || exactAddress.length < 5) return { ok: false, error: "Заполните название, регион, город, часовой пояс и точный адрес." };
  if (maxGuests === null || bedrooms === null || beds === null || bathrooms === null || nightlyPriceMinor === null || minimumStayNights === null || depositMinor === null && row.depositMinor !== null && row.depositMinor !== "" && row.depositMinor !== undefined) return { ok: false, error: "Проверьте вместимость, комнаты, цену, депозит и минимальный срок." };
  if ((publicLatitude === null) !== (publicLongitude === null)) return { ok: false, error: "Публичные координаты указываются только парой." };
  if (row.publicLatitude != null && row.publicLatitude !== "" && publicLatitude === null || row.publicLongitude != null && row.publicLongitude !== "" && publicLongitude === null) return { ok: false, error: "Проверьте публичные координаты." };
  if (depositMinor !== null && !depositDisclosure) return { ok: false, error: "Опишите условия депозита." };
  if (publicLatitude !== null && (publicLatitude !== Math.round(publicLatitude * 100) / 100 || publicLongitude !== Math.round(publicLongitude! * 100) / 100)) return { ok: false, error: "Публичная точка должна быть приблизительной — не точнее двух знаков." };
  if (!images) return { ok: false, error: "Проверьте фотографии, подписи и права на изображения." };
  return { ok: true, value: {
    marketId, countryCode, slug, propertyTimezone, title, summary, description, locality, region,
    publicLocationNote: text(row.publicLocationNote, 300), publicLatitude, publicLongitude,
    exactAddress, accessInstructions: text(row.accessInstructions, 2000), maxGuests, bedrooms,
    beds, bathrooms, amenities: strings(row.amenities, 80), houseRules: strings(row.houseRules, 40),
    nightlyPriceMinor, currency, minimumStayNights, depositMinor, depositDisclosure,
    cancellationDisclosure: text(row.cancellationDisclosure, 1000), images,
  } };
}

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
