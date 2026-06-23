import { isHtmlContent, sanitizeHtml } from "@/lib/rich-text";
import type {
  Sputnik8OrderLine,
  Sputnik8Photo,
  Sputnik8Product,
  Sputnik8ReviewListItem,
} from "@/lib/sputnik8/types";
import type {
  ExcursionDescriptionBlock,
  ExcursionGuide,
  ExcursionLocationPoint,
  ExcursionPhoto,
  ExcursionReview,
  ExcursionTicketOption,
} from "@/types/excursion";

export type ParsedSputnik8Payload = {
  guide?: ExcursionGuide;
  descriptionBlocks: ExcursionDescriptionBlock[];
  meetingPoint?: ExcursionLocationPoint;
  finishPoint?: ExcursionLocationPoint;
  priceIncluded?: string;
  priceExcluded?: string;
  movementType?: string;
  isBookable: boolean;
  ticketOptions: ExcursionTicketOption[];
  priceDescription?: string;
  coverImage?: string;
  photos: ExcursionPhoto[];
  placesToSee?: string;
  languages?: string[];
  payTypeInText?: string;
  minimumBookPeriod?: string;
  refundPolicy?: string;
};

export type ResolvedSputnik8Price = {
  value: number | null;
  currency: string | null;
  display: string | null;
  from: boolean;
};

export function parsePriceString(raw: unknown): number | null {
  if (raw == null) return null;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw !== "string") return null;

  const normalized = raw.replace(/\s/g, "");
  const match = normalized.match(/[\d]+(?:[.,]\d+)?/);
  if (!match) return null;

  const value = Number.parseFloat(match[0].replace(",", "."));
  return Number.isFinite(value) ? value : null;
}

export function parseDurationString(raw: unknown): number | null {
  if (raw == null) return null;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return raw < 24 ? Math.round(raw * 60) : Math.round(raw);
  }
  if (typeof raw !== "string") return null;

  const text = raw.trim().toLowerCase();
  if (!text) return null;

  const hourMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:ч(?:ас(?:а|ов)?)?|h(?:our|rs)?)\b/);
  const minuteMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:мин(?:ут(?:а|ы)?)?|min(?:ute)?s?)\b/);

  const hours = hourMatch ? Number.parseFloat(hourMatch[1].replace(",", ".")) : 0;
  const minutes = minuteMatch ? Number.parseFloat(minuteMatch[1].replace(",", ".")) : 0;

  if (hours > 0 || minutes > 0) {
    return Math.round(hours * 60 + minutes);
  }

  const plain = Number.parseFloat(text.replace(",", "."));
  if (Number.isFinite(plain) && plain > 0 && plain < 48) {
    return Math.round(plain * 60);
  }

  return null;
}

export function resolveDurationMinutes(product: Sputnik8Product): number | null {
  if (product.duration_minutes != null) {
    return Math.round(Number(product.duration_minutes));
  }
  if (product.duration_hours != null) {
    return Math.round(Number(product.duration_hours) * 60);
  }

  const fromDuration = parseDurationString(product.duration);
  if (fromDuration != null) return fromDuration;

  return null;
}

function resolveUsdPriceFromLine(line: Sputnik8OrderLine): number | null {
  const direct = parsePriceString(line.price);
  if (direct != null) {
    const currency = typeof line.currency === "string" ? line.currency.trim().toUpperCase() : "USD";
    if (!currency || currency === "USD") return direct;
  }

  const usdEntry = line.all_prices?.find((entry) => {
    const currency = entry.currency?.trim().toUpperCase();
    return !currency || currency === "USD";
  });

  if (usdEntry) {
    if (usdEntry.value != null && Number.isFinite(usdEntry.value)) return usdEntry.value;
    return parsePriceString(usdEntry.price);
  }

  return null;
}

export function parseTicketOptionsFromProduct(product: Sputnik8Product): ExcursionTicketOption[] {
  const fromOrderOptions =
    product.order_options?.flatMap((option) =>
      (option.order_lines ?? []).map((line, index) => ({
        id: line.id ?? option.id * 100 + index,
        title: (line.title ?? line.name ?? option.title ?? option.name ?? "Участник").trim(),
        isDefault: line.is_default ?? option.is_default ?? false,
        value: resolveUsdPriceFromLine(line) ?? undefined,
      }))
    ) ?? [];

  if (fromOrderOptions.length > 0) return fromOrderOptions;

  const price = product.price;
  if (!price || typeof price === "number" || typeof price === "string") return [];

  const perPerson = price.per_person;
  if (!Array.isArray(perPerson) || perPerson.length === 0) return [];

  return perPerson.map((ticket) => ({
    id: ticket.id,
    title: ticket.title?.trim() || "Участник",
    isDefault: ticket.is_default ?? false,
    value: ticket.value,
  }));
}

export function resolvePrice(product: Sputnik8Product): ResolvedSputnik8Price {
  const ticketOptions = parseTicketOptionsFromProduct(product);
  const defaultTicket =
    ticketOptions.find((ticket) => ticket.isDefault) ??
    ticketOptions.reduce<ExcursionTicketOption | undefined>((lowest, ticket) => {
      if (ticket.value == null) return lowest;
      if (!lowest || lowest.value == null || ticket.value < lowest.value) return ticket;
      return lowest;
    }, undefined);

  if (defaultTicket?.value != null) {
    return {
      value: defaultTicket.value,
      currency: "USD",
      display: null,
      from: ticketOptions.length > 1 || defaultTicket.isDefault !== true,
    };
  }

  if (product.base_price) {
    const baseValue =
      product.base_price.value ??
      parsePriceString(product.base_price.price);
    if (baseValue != null) {
      return {
        value: baseValue,
        currency: (product.base_price.currency ?? product.currency ?? "USD").trim().toUpperCase(),
        display: product.base_price.price?.trim() ?? null,
        from: true,
      };
    }
  }

  const price = product.price;
  if (typeof price === "number") {
    return {
      value: price,
      currency: product.currency ?? null,
      display: null,
      from: true,
    };
  }

  if (typeof price === "string") {
    const value = parsePriceString(price);
    return {
      value,
      currency: product.currency ?? "USD",
      display: price.trim(),
      from: /^(от|from|desde)\b/i.test(price.trim()),
    };
  }

  if (!price || typeof price !== "object") {
    return { value: null, currency: product.currency ?? null, display: null, from: true };
  }

  return {
    value: price.value ?? null,
    currency: price.currency ?? product.currency ?? null,
    display: price.value_string ?? null,
    from: price.price_from !== false,
  };
}

export function mapPhotos(photos?: Sputnik8Photo[]): ExcursionPhoto[] {
  if (!photos?.length) return [];
  return photos.map((photo) => ({
    thumbnail: photo.thumbnail || photo.small || photo.photo_url || photo.url,
    medium:
      photo.original ||
      photo.big ||
      photo.medium ||
      photo.url ||
      photo.photo_url,
    type: "photo",
  }));
}

export function extractPhotosFromProduct(product: Sputnik8Product): ExcursionPhoto[] {
  const collected: ExcursionPhoto[] = [];
  const seen = new Set<string>();

  const pushPhoto = (medium?: string | null, thumbnail?: string | null) => {
    const normalizedMedium = medium?.trim();
    if (!normalizedMedium || seen.has(normalizedMedium)) return;
    seen.add(normalizedMedium);
    collected.push({
      thumbnail: thumbnail?.trim() || product.image_small || product.cover_photo?.small || normalizedMedium,
      medium: normalizedMedium,
      type: "photo",
    });
  };

  pushPhoto(
    product.cover_photo?.big || product.image_big || product.main_photo,
    product.cover_photo?.small || product.image_small || product.cover_photo?.medium
  );

  if (product.cover_photo?.medium && product.cover_photo.medium !== product.cover_photo.big) {
    pushPhoto(product.cover_photo.medium, product.cover_photo.small);
  }

  for (const photo of mapPhotos(product.photos ?? product.images)) {
    const medium = photo.medium?.trim();
    if (!medium || seen.has(medium)) continue;
    seen.add(medium);
    collected.push(photo);
  }

  return collected;
}

/** Объединяет краткую запись из списка с полной карточкой из /products/:id. */
export function mergeSputnik8ProductSources(
  listProduct: Sputnik8Product,
  detailProduct: Sputnik8Product
): Sputnik8Product {
  const detailPhotos = detailProduct.photos ?? detailProduct.images;
  const listPhotos = listProduct.photos ?? listProduct.images;

  return {
    ...listProduct,
    ...detailProduct,
    city_id: detailProduct.city_id ?? listProduct.city_id,
    city: detailProduct.city ?? listProduct.city,
    photos: detailPhotos?.length ? detailPhotos : listPhotos,
    images: detailPhotos?.length ? detailPhotos : listPhotos,
    cover_photo: detailProduct.cover_photo ?? listProduct.cover_photo,
    description: detailProduct.description?.trim() || listProduct.description,
    short_info: detailProduct.short_info?.trim() || listProduct.short_info,
    important_info: detailProduct.important_info?.trim() || listProduct.important_info,
    refund_info: detailProduct.refund_info?.trim() || listProduct.refund_info,
    what_included: detailProduct.what_included ?? listProduct.what_included,
    what_not_included: detailProduct.what_not_included ?? listProduct.what_not_included,
    places_to_see: detailProduct.places_to_see?.trim() || listProduct.places_to_see,
    begin_place: detailProduct.begin_place ?? listProduct.begin_place,
    finish_point: detailProduct.finish_point ?? listProduct.finish_point,
    host: detailProduct.host ?? listProduct.host,
    guide: detailProduct.guide ?? listProduct.guide,
    group_size_max: detailProduct.group_size_max ?? listProduct.group_size_max,
    max_persons: detailProduct.max_persons ?? detailProduct.group_size_max ?? listProduct.max_persons,
    reviews_list: detailProduct.reviews_list?.length
      ? detailProduct.reviews_list
      : listProduct.reviews_list,
    reviews_count:
      detailProduct.reviews_count ??
      detailProduct.review_count ??
      listProduct.reviews_count ??
      listProduct.review_count,
    review_count:
      detailProduct.review_count ??
      detailProduct.reviews_count ??
      listProduct.review_count ??
      listProduct.reviews_count,
    rating: detailProduct.rating ?? listProduct.rating,
    order_options: detailProduct.order_options?.length
      ? detailProduct.order_options
      : listProduct.order_options,
  };
}

export function productNeedsDetailEnrichment(product: Sputnik8Product): boolean {
  const photos = extractPhotosFromProduct(product);
  if (photos.length <= 1) return true;
  if (!product.important_info?.trim() && !product.refund_info?.trim()) return true;
  return false;
}

export function resolveCoverImage(product: Sputnik8Product): string | undefined {
  const photos = extractPhotosFromProduct(product);
  const first = photos[0];
  return (
    first?.medium ||
    first?.thumbnail ||
    product.cover_photo?.big ||
    product.image_big ||
    product.main_photo ||
    product.cover_photo?.medium ||
    product.city?.cover_image ||
    product.city?.image_url ||
    product.city?.photo_url ||
    undefined
  );
}

function parseLocationPoint(raw: unknown): ExcursionLocationPoint | undefined {
  if (typeof raw === "string" && raw.trim()) {
    return { text: raw.trim() };
  }
  if (!raw || typeof raw !== "object") return undefined;

  const point = raw as {
    text?: string | null;
    address?: string | null;
    description?: string | null;
  };
  const text = point.text?.trim() || point.address?.trim() || point.description?.trim();
  if (!text) return undefined;
  return { text };
}

function parseDescriptionBlocks(raw: unknown): ExcursionDescriptionBlock[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((block) => {
      if (Array.isArray(block) && block.length >= 2) {
        return {
          title: String(block[0] ?? "").trim(),
          html: sanitizeHtml(String(block[1] ?? "")),
        };
      }
      if (block && typeof block === "object") {
        const entry = block as { title?: string; html?: string; content?: string };
        return {
          title: entry.title?.trim() || "",
          html: sanitizeHtml(entry.html?.trim() || entry.content?.trim() || ""),
        };
      }
      return null;
    })
    .filter((block): block is ExcursionDescriptionBlock => Boolean(block?.html));
}

function parseIncludedList(raw: unknown): string | undefined {
  if (!raw) return undefined;

  if (Array.isArray(raw)) {
    const items = raw.map((item) => String(item).trim()).filter(Boolean);
    return items.length ? items.map((item) => `• ${item}`).join("\n") : undefined;
  }

  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;

  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed)) {
        const items = parsed.map((item) => String(item).trim()).filter(Boolean);
        return items.length ? items.map((item) => `• ${item}`).join("\n") : undefined;
      }
    } catch {
      // fall through to plain text parsing
    }
  }

  const quotedItems = [...trimmed.matchAll(/"([^"]+)"/g)].map((match) => match[1].trim()).filter(Boolean);
  if (quotedItems.length > 0) {
    return quotedItems.map((item) => `• ${item}`).join("\n");
  }

  if (trimmed.includes("\n")) {
    return trimmed
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => (line.startsWith("•") ? line : `• ${line}`))
      .join("\n");
  }

  return trimmed;
}

function parseLanguages(raw: unknown): string[] | undefined {
  if (!raw) return undefined;
  if (Array.isArray(raw)) {
    const items = raw.map((item) => String(item).trim()).filter(Boolean);
    return items.length ? items : undefined;
  }
  if (typeof raw === "string") {
    const items = raw
      .split(/[,;|]/)
      .map((item) => item.trim())
      .filter(Boolean);
    return items.length ? items : undefined;
  }
  return undefined;
}

function parseGuide(product: Sputnik8Product): ExcursionGuide | undefined {
  const guideRaw = product.guide ?? product.host;
  if (!guideRaw) return undefined;

  const displayName = (guideRaw.name ?? guideRaw.first_name ?? "").trim();
  if (!displayName) return undefined;

  const numericId =
    typeof guideRaw.id === "number"
      ? guideRaw.id
      : typeof guideRaw.id === "string" && /^\d+$/.test(guideRaw.id)
        ? Number.parseInt(guideRaw.id, 10)
        : typeof guideRaw.name === "string" && /^\d+$/.test(guideRaw.name)
          ? Number.parseInt(guideRaw.name, 10)
          : 0;

  return {
    id: numericId,
    name: displayName,
    avatar: guideRaw.photo?.trim() || guideRaw.avatar_url || guideRaw.photo_url,
    url: guideRaw.link?.trim() || guideRaw.url?.trim() || undefined,
  };
}

function buildRichTextBlock(title: string, raw?: string | null): ExcursionDescriptionBlock | null {
  const text = raw?.trim();
  if (!text) return null;

  const html = isHtmlContent(text)
    ? sanitizeHtml(text.replace(/\r\n/g, "\n"))
    : sanitizeHtml(
        text
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line) => (line.startsWith("•") ? line : line))
          .join("<br>")
      );

  if (!html) return null;
  return { title, html };
}

function parseInfoObject(raw: unknown): string | undefined {
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  if (!raw || typeof raw !== "object") return undefined;

  const record = raw as Record<string, unknown>;
  const parts = Object.values(record)
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);

  return parts.length ? parts.join("\n") : undefined;
}

function appendUniqueBlock(
  blocks: ExcursionDescriptionBlock[],
  block: ExcursionDescriptionBlock | null
) {
  if (!block?.html) return;
  const normalizedHtml = block.html.replace(/\s+/g, " ").trim();
  if (blocks.some((existing) => existing.html.replace(/\s+/g, " ").trim() === normalizedHtml)) {
    return;
  }
  blocks.push(block);
}

function buildDescriptionBlocks(product: Sputnik8Product): ExcursionDescriptionBlock[] {
  const blocks: ExcursionDescriptionBlock[] = [];

  for (const block of parseDescriptionBlocks(product.description_blocks)) {
    appendUniqueBlock(blocks, block);
  }

  appendUniqueBlock(blocks, buildRichTextBlock("Об экскурсии", product.description));
  appendUniqueBlock(blocks, buildRichTextBlock("Важная информация", product.important_info));
  appendUniqueBlock(
    blocks,
    buildRichTextBlock("Что взять с собой", parseInfoObject(product.required_info))
  );
  appendUniqueBlock(
    blocks,
    buildRichTextBlock("Документы", parseInfoObject(product.document))
  );

  return blocks;
}

export function mapSputnik8ReviewsList(raw: unknown): ExcursionReview[] {
  if (!Array.isArray(raw)) return [];

  const reviews: ExcursionReview[] = [];

  raw.forEach((entry, index) => {
    const review = entry as Sputnik8ReviewListItem;
    const text = review.content?.trim() || review.text?.trim();
    const authorName = review.name?.trim() || review.author_name?.trim();
    const createdAt = review.date?.trim() || review.created_at?.trim();
    const id =
      typeof review.id === "number"
        ? review.id
        : typeof review.activity_id === "number"
          ? review.activity_id * 1000 + index
          : index + 1;

    if (!text && review.rating == null) return;

    reviews.push({
      id,
      rating: review.rating ?? undefined,
      authorName: authorName || undefined,
      text: text || undefined,
      createdAt: createdAt || undefined,
      photos: review.photos?.filter(Boolean),
    });
  });

  return reviews;
}

export function parseSputnik8Payload(payload: unknown): ParsedSputnik8Payload {
  const product = payload as Sputnik8Product | null | undefined;
  if (!product) {
    return {
      descriptionBlocks: [],
      ticketOptions: [],
      isBookable: false,
      photos: [],
    };
  }

  const photos = extractPhotosFromProduct(product);
  const placesToSee = product.places_to_see?.trim() || undefined;
  const descriptionBlocks = buildDescriptionBlocks(product);

  const price =
    product.price && typeof product.price === "object" ? product.price : undefined;

  const minimumBookPeriod =
    product.minimum_book_period != null ? String(product.minimum_book_period).trim() : undefined;

  const refundPolicy = product.refund_info?.trim() || undefined;

  return {
    guide: parseGuide(product),
    descriptionBlocks,
    meetingPoint:
      parseLocationPoint(product.begin_place) ??
      parseLocationPoint(product.meeting_point),
    finishPoint: parseLocationPoint(product.finish_point),
    priceIncluded:
      parseIncludedList(product.what_included) ??
      (product.price_included_description?.trim() ||
        product.included?.trim() ||
        undefined),
    priceExcluded:
      parseIncludedList(product.what_not_included) ??
      (product.price_not_included_description?.trim() ||
        product.not_included?.trim() ||
        undefined),
    movementType:
      product.movement_type?.trim() ||
      product.transport_type?.trim() ||
      undefined,
    isBookable:
      product.is_bookable !== false && product.available_for_booking !== false,
    ticketOptions: parseTicketOptionsFromProduct(product),
    priceDescription: price?.price_description?.trim() || undefined,
    coverImage: resolveCoverImage(product),
    photos,
    placesToSee,
    languages: parseLanguages(product.languages),
    payTypeInText: product.pay_type_in_text?.trim() || undefined,
    minimumBookPeriod: minimumBookPeriod || undefined,
    refundPolicy,
  };
}
