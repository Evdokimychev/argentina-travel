export function parsePriceString(raw) {
  if (raw == null) return null;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw !== "string") return null;

  const normalized = raw.replace(/\s/g, "");
  const match = normalized.match(/[\d]+(?:[.,]\d+)?/);
  if (!match) return null;

  const value = Number.parseFloat(match[0].replace(",", "."));
  return Number.isFinite(value) ? value : null;
}

export function parseDurationString(raw) {
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

export function resolveDurationMinutes(product) {
  if (product.duration_minutes != null) {
    return Math.round(Number(product.duration_minutes));
  }
  if (product.duration_hours != null) {
    return Math.round(Number(product.duration_hours) * 60);
  }
  return parseDurationString(product.duration);
}

function resolveUsdPriceFromLine(line) {
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

function parseTicketOptionsFromProduct(product) {
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

export function resolvePrice(product) {
  const ticketOptions = parseTicketOptionsFromProduct(product);
  const defaultTicket =
    ticketOptions.find((ticket) => ticket.isDefault) ??
    ticketOptions.reduce((lowest, ticket) => {
      if (ticket.value == null) return lowest;
      if (!lowest || lowest.value == null || ticket.value < lowest.value) return ticket;
      return lowest;
    }, undefined);

  if (defaultTicket?.value != null) {
    return {
      value: defaultTicket.value,
      currency: "USD",
      display: null,
    };
  }

  if (product.base_price) {
    const baseValue = product.base_price.value ?? parsePriceString(product.base_price.price);
    if (baseValue != null) {
      return {
        value: baseValue,
        currency: (product.base_price.currency ?? product.currency ?? "USD").trim().toUpperCase(),
        display: product.base_price.price?.trim() ?? null,
      };
    }
  }

  const price = product.price;
  if (typeof price === "number") {
    return { value: price, currency: product.currency ?? null, display: null };
  }

  if (typeof price === "string") {
    return {
      value: parsePriceString(price),
      currency: product.currency ?? "USD",
      display: price.trim(),
    };
  }

  if (!price || typeof price !== "object") {
    return { value: null, currency: product.currency ?? null, display: null };
  }

  return {
    value: price.value ?? null,
    currency: price.currency ?? product.currency ?? null,
    display: price.value_string ?? null,
  };
}

export function extractPhotosFromProduct(product) {
  const collected = [];
  const seen = new Set();

  const pushPhoto = (medium, thumbnail) => {
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

  for (const photo of product.photos ?? product.images ?? []) {
    const medium = (photo.medium || photo.big || photo.original || photo.url || photo.photo_url)?.trim();
    if (!medium || seen.has(medium)) continue;
    seen.add(medium);
    collected.push({
      thumbnail: photo.thumbnail || photo.small || photo.photo_url || photo.url || medium,
      medium,
      type: "photo",
    });
  }

  return collected;
}

export function resolveCoverImage(product) {
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
    null
  );
}
