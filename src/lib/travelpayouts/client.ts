import "server-only";

import { getTravelpayoutsConfig, isTravelpayoutsConfigured } from "@/lib/travelpayouts/env";
import type {
  TravelpayoutsCreateLinksRequest,
  TravelpayoutsCreateLinksResponse,
  TravelpayoutsLinkInput,
  TravelpayoutsLinkResult,
} from "@/lib/travelpayouts/types";

const LINKS_API_URL = "https://api.travelpayouts.com/links/v1/create";
const DEFAULT_LINKS_API_TIMEOUT_MS = 10_000;

export class TravelpayoutsError extends Error {
  readonly status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "TravelpayoutsError";
    this.status = status;
  }
}

function mapLinkResult(item: NonNullable<TravelpayoutsCreateLinksResponse["result"]>["links"][number]): TravelpayoutsLinkResult {
  return {
    url: item.url,
    code: item.code,
    partnerUrl: item.partner_url?.trim() || null,
    message: item.message,
  };
}

function isHttpUrl(value: string | null | undefined): value is string {
  if (!value?.trim()) return false;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function validateLinksResponse(
  body: TravelpayoutsCreateLinksResponse | null,
  expected: { count: number; marker: number; trs: number }
): NonNullable<TravelpayoutsCreateLinksResponse["result"]>["links"] {
  if (!body || body.code !== "success" || body.status !== 200 || !body.result) {
    throw new TravelpayoutsError("Travelpayouts API returned an invalid success payload", 502);
  }

  if (body.result.marker !== expected.marker || body.result.trs !== expected.trs) {
    throw new TravelpayoutsError("Travelpayouts API returned mismatched attribution identifiers", 502);
  }

  const results = body.result.links;
  if (!Array.isArray(results) || results.length !== expected.count) {
    throw new TravelpayoutsError("Travelpayouts API returned a mismatched links payload", 502);
  }

  const failedIndex = results.findIndex(
    (item) => item.code !== "success" || (!isHttpUrl(item.partner_url) && !isHttpUrl(item.url))
  );
  if (failedIndex >= 0) {
    const failed = results[failedIndex];
    const detail = failed?.message?.trim() || failed?.code?.trim() || "invalid link";
    throw new TravelpayoutsError(
      `Travelpayouts link ${failedIndex + 1} failed: ${detail}`,
      502
    );
  }

  return results;
}

export async function createTravelpayoutsPartnerLinks(
  links: TravelpayoutsLinkInput[],
  options?: { shorten?: boolean; timeoutMs?: number }
): Promise<TravelpayoutsLinkResult[]> {
  if (!links.length) return [];

  const config = getTravelpayoutsConfig();
  const payload: TravelpayoutsCreateLinksRequest = {
    trs: config.trs,
    marker: config.marker,
    shorten: options?.shorten ?? config.defaultShorten,
    links: links.map((link) => ({
      url: link.url,
      ...(link.subId ? { sub_id: link.subId } : {}),
    })),
  };

  const timeoutMs =
    Number.isFinite(options?.timeoutMs) && Number(options?.timeoutMs) > 0
      ? Number(options?.timeoutMs)
      : DEFAULT_LINKS_API_TIMEOUT_MS;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(LINKS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Access-Token": config.apiKey,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new TravelpayoutsError("Travelpayouts API request timed out", 504);
    }
    throw new TravelpayoutsError(
      error instanceof Error
        ? `Travelpayouts API request failed: ${error.message}`
        : "Travelpayouts API request failed",
      502
    );
  } finally {
    clearTimeout(timeout);
  }

  const body = (await response.json().catch(() => null)) as TravelpayoutsCreateLinksResponse | null;

  if (!response.ok) {
    const message =
      body?.error ||
      (response.status === 401 ? "Invalid Travelpayouts API token" : "Travelpayouts API request failed");
    throw new TravelpayoutsError(message, response.status);
  }

  return validateLinksResponse(body, {
    count: links.length,
    marker: config.marker,
    trs: config.trs,
  }).map(mapLinkResult);
}

export async function createTravelpayoutsPartnerLink(
  link: TravelpayoutsLinkInput,
  options?: { shorten?: boolean }
): Promise<TravelpayoutsLinkResult> {
  const [result] = await createTravelpayoutsPartnerLinks([link], options);
  if (!result) {
    throw new TravelpayoutsError("Travelpayouts API returned no link result");
  }
  return result;
}

/** Wrap a Tripster experience URL with Travelpayouts attribution. */
export async function createTripsterAffiliateLink(input: {
  tripsterUrl: string;
  experienceId?: string | number;
  citySlug?: string;
  shorten?: boolean;
}): Promise<TravelpayoutsLinkResult> {
  const subIdParts = ["tripster"];
  if (input.citySlug) subIdParts.push(input.citySlug);
  if (input.experienceId != null) subIdParts.push(String(input.experienceId));

  return createTravelpayoutsPartnerLink(
    {
      url: input.tripsterUrl,
      subId: subIdParts.join(":"),
    },
    { shorten: input.shorten }
  );
}

/** Wrap a YouTravel.me tour URL with Travelpayouts attribution. */
export async function createYouTravelAffiliateLink(input: {
  youtravelUrl: string;
  tourId?: string | number;
  country?: string;
  shorten?: boolean;
}): Promise<TravelpayoutsLinkResult> {
  const subIdParts = ["youtravel"];
  if (input.country) subIdParts.push(input.country.toLowerCase().replace(/\s+/g, "-"));
  if (input.tourId != null) subIdParts.push(String(input.tourId));

  return createTravelpayoutsPartnerLink(
    {
      url: input.youtravelUrl,
      subId: subIdParts.join(":"),
    },
    { shorten: input.shorten }
  );
}
/** Wrap a Sputnik8 product URL with Travelpayouts attribution. */
export async function createSputnik8AffiliateLink(input: {
  sputnik8Url: string;
  productId?: string | number;
  citySlug?: string;
  shorten?: boolean;
}): Promise<TravelpayoutsLinkResult> {
  const subIdParts = ["sputnik8"];
  if (input.citySlug) subIdParts.push(input.citySlug);
  if (input.productId != null) subIdParts.push(String(input.productId));

  return createTravelpayoutsPartnerLink(
    {
      url: input.sputnik8Url,
      subId: subIdParts.join(":"),
    },
    { shorten: input.shorten }
  );
}

export { isTravelpayoutsConfigured };
