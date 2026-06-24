/**
 * Shared YouTravel.me v2 partner API helpers (scripts).
 * Docs: https://ytme.atlassian.net/wiki/external/NTA0ZDQ5OTRhODFjNDcwYjkxMzBjMWVlNWY0YmNlMjE
 */

export function resolvePartnerPid() {
  return process.env.YOUTRAVEL_PARTNER_PID?.trim() || "1173";
}

export function resolveApiLang() {
  return process.env.YOUTRAVEL_API_LANG?.trim() || "ru";
}

export function resolveSerpCurrency() {
  return (process.env.YOUTRAVEL_SERP_CURRENCY?.trim() || "usd").toLowerCase();
}

export function resolveDetailCurrency() {
  return (process.env.YOUTRAVEL_DETAIL_CURRENCY?.trim() || "USD").toUpperCase();
}

export function unwrapYouTravelList(body) {
  if (!body) return [];
  if (Array.isArray(body)) return body;
  const data = body.data;
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    for (const key of ["items", "offers", "tours", "reviews"]) {
      if (Array.isArray(data[key])) return data[key];
    }
    if (data.tour && typeof data.tour === "object") return [data.tour];
    if (data.id != null) return [data];
  }
  return body.items ?? body.tours ?? body.offers ?? [];
}

export function unwrapYouTravelTour(body) {
  if (!body) return null;
  if (body.data?.tour && typeof body.data.tour === "object") return body.data.tour;
  if (body.data && typeof body.data === "object" && body.data.id != null) return body.data;
  return unwrapYouTravelList(body)[0] ?? null;
}

export function buildSerpPath({ take, skip }) {
  const params = new URLSearchParams({
    take: String(take),
    skip: String(skip ?? 0),
    currency: resolveSerpCurrency(),
    lang: resolveApiLang(),
  });
  return `/v2/serp/tours?${params.toString()}`;
}

export function buildPartnerTourPath(tourId) {
  const params = new URLSearchParams({
    pid: resolvePartnerPid(),
    currency: resolveDetailCurrency(),
    lang: resolveApiLang(),
  });
  return `/v2/partners/tours/${encodeURIComponent(String(tourId))}?${params.toString()}`;
}

export function buildPartnerOffersPath(tourId) {
  const params = new URLSearchParams({
    pid: resolvePartnerPid(),
    currency: resolveDetailCurrency(),
    lang: resolveApiLang(),
  });
  return `/v2/partners/tours/${encodeURIComponent(String(tourId))}/offers?${params.toString()}`;
}

export async function youtravelFetchJson(apiBase, authHeaders, path) {
  const response = await fetch(`${apiBase}${path}`, {
    headers: { ...authHeaders, Accept: "application/json" },
  });
  const body = await response.json().catch(() => null);
  return { response, body };
}

export function matchesYouTravelCountry(item, matchers) {
  if (!matchers.length) return true;
  const haystack = [
    ...(Array.isArray(item.countries) ? item.countries : []),
    item.country,
    item.region,
    ...(Array.isArray(item.regions) ? item.regions : []),
    item.destination,
    item.title,
    item.name,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return matchers.some((matcher) => haystack.includes(matcher.toLowerCase()));
}

export function parseOfferDate(value) {
  if (!value) return null;
  const raw = String(value).trim();
  const dotted = raw.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (dotted) return `${dotted[3]}-${dotted[2]}-${dotted[1]}`;
  return raw.slice(0, 10);
}

export function resolvePartnerOfferLink(offer) {
  return (
    offer?.link?.trim() ||
    offer?.partner_link?.trim() ||
    offer?.partnerLink?.trim() ||
    offer?.url?.trim() ||
    null
  );
}

export async function fetchSerpPage(apiBase, authHeaders, { take, skip }) {
  const { response, body } = await youtravelFetchJson(apiBase, authHeaders, buildSerpPath({ take, skip }));
  if (!response.ok) {
    throw new Error(`YouTravel serp fetch failed (${response.status})`);
  }
  if (body?.success === false && !unwrapYouTravelList(body).length) {
    throw new Error("YouTravel auth failed — check credentials");
  }
  return {
    items: unwrapYouTravelList(body),
    total: body?.data?.total ?? null,
  };
}

export async function discoverYouTravelTourIds(apiBase, authHeaders, countryMatchers, options = {}) {
  const pageSize = Math.min(options.pageSize ?? 200, 200);
  const maxPages = options.maxPages ?? Number.parseInt(process.env.YOUTRAVEL_SERP_MAX_PAGES ?? "60", 10);
  const seen = new Map();

  for (let page = 0; page < maxPages; page += 1) {
    const skip = page * pageSize;
    const { items, total } = await fetchSerpPage(apiBase, authHeaders, { take: pageSize, skip });
    if (!items.length) break;

    for (const item of items) {
      const id = item?.id;
      if (id == null || seen.has(id)) continue;
      if (matchesYouTravelCountry(item, countryMatchers)) {
        seen.set(id, item);
      }
    }

    if (items.length < pageSize) break;
    if (total != null && skip + items.length >= total) break;
    if (options.onPage) options.onPage(page + 1, seen.size, total);
    await new Promise((resolve) => setTimeout(resolve, options.delayMs ?? 120));
  }

  return seen;
}

export async function fetchPartnerTourDetail(apiBase, authHeaders, tourId) {
  const { response, body } = await youtravelFetchJson(
    apiBase,
    authHeaders,
    buildPartnerTourPath(tourId)
  );
  if (!response.ok) return null;
  return unwrapYouTravelTour(body);
}

export async function fetchPartnerTourOffers(apiBase, authHeaders, tourId) {
  const { response, body } = await youtravelFetchJson(
    apiBase,
    authHeaders,
    buildPartnerOffersPath(tourId)
  );
  if (!response.ok) return [];
  return unwrapYouTravelList(body);
}

export function buildPartnerReviewsPath(tourId) {
  const params = new URLSearchParams({
    pid: resolvePartnerPid(),
    currency: resolveDetailCurrency(),
    lang: resolveApiLang(),
    take: "50",
  });
  return `/v2/partners/tours/${encodeURIComponent(String(tourId))}/reviews?${params.toString()}`;
}

export function buildPublicReviewsUrl(tourId, lang = resolveApiLang(), limit = 50) {
  const params = new URLSearchParams({
    lang,
    limit: String(limit),
  });
  return `https://youtravel.me/api/v2/tours/public/${encodeURIComponent(String(tourId))}/reviews?${params.toString()}`;
}

export async function fetchPublicTourReviews(tourId) {
  try {
    const response = await fetch(buildPublicReviewsUrl(tourId), {
      headers: {
        Accept: "application/json",
        "User-Agent": "goargentina-youtravel-sync/1.0",
      },
    });
    if (!response.ok) return [];
    const body = await response.json().catch(() => null);
    return unwrapYouTravelList(body);
  } catch {
    return [];
  }
}

export async function fetchPartnerTourReviews(apiBase, authHeaders, tourId) {
  const publicReviews = await fetchPublicTourReviews(tourId);
  if (publicReviews.length) return publicReviews;

  const paths = [
    buildPartnerReviewsPath(tourId),
    `/v2/tours/${encodeURIComponent(String(tourId))}/reviews?lang=${resolveApiLang()}&take=50`,
  ];

  for (const path of paths) {
    const { response, body } = await youtravelFetchJson(apiBase, authHeaders, path);
    if (!response.ok) continue;
    const reviews = unwrapYouTravelList(body);
    if (reviews.length) return reviews;
  }

  return [];
}
