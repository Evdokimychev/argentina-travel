import "server-only";

import { getTravelpayoutsConfig, isTravelpayoutsConfigured } from "@/lib/travelpayouts/env";
import type {
  TravelpayoutsCreateLinksRequest,
  TravelpayoutsCreateLinksResponse,
  TravelpayoutsLinkInput,
  TravelpayoutsLinkResult,
} from "@/lib/travelpayouts/types";

const LINKS_API_URL = "https://api.travelpayouts.com/links/v1/create";

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

export async function createTravelpayoutsPartnerLinks(
  links: TravelpayoutsLinkInput[],
  options?: { shorten?: boolean }
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

  const response = await fetch(LINKS_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Access-Token": config.apiKey,
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const body = (await response.json().catch(() => null)) as TravelpayoutsCreateLinksResponse | null;

  if (!response.ok) {
    const message =
      body?.error ||
      (response.status === 401 ? "Invalid Travelpayouts API token" : "Travelpayouts API request failed");
    throw new TravelpayoutsError(message, response.status);
  }

  if (!body?.result?.links?.length) {
    throw new TravelpayoutsError("Travelpayouts API returned an empty links payload");
  }

  return body.result.links.map(mapLinkResult);
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
