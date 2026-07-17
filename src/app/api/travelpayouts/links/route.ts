import { NextResponse } from "next/server";
import {
  createTravelpayoutsPartnerLinks,
  isTravelpayoutsConfigured,
  TravelpayoutsError,
} from "@/lib/travelpayouts";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { getClientIp, withRateLimit } from "@/lib/rate-limit";
import { isAllowedTravelpayoutsTargetUrl } from "@/lib/travelpayouts/target-url";
import { publicApiError } from "@/lib/public-api/safe-error";

type CreateLinksBody = {
  links?: Array<{ url?: string; subId?: string }>;
  shorten?: boolean;
};

async function postPartnerLinks(request: Request) {
  if (process.env.TRAVELPAYOUTS_LINKS_ROUTE_ENABLED !== "true") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const auth = await authorizeAdminRequest(request, "system.settings");
  if (!auth.ok) return auth.response;

  if (!isTravelpayoutsConfigured()) {
    return NextResponse.json(publicApiError("PARTNER_DATA_UNAVAILABLE"), { status: 503 });
  }

  let body: CreateLinksBody;
  try {
    body = (await request.json()) as CreateLinksBody;
  } catch {
    return NextResponse.json(publicApiError("INVALID_REQUEST"), { status: 400 });
  }

  const links = (body.links ?? [])
    .map((item) => ({
      url: item.url?.trim() ?? "",
      subId: item.subId?.trim() || undefined,
    }))
    .filter((item) => item.url.length > 0);

  if (!links.length) {
    return NextResponse.json({
      ...publicApiError("INVALID_REQUEST"),
      error: "Добавьте хотя бы одну корректную ссылку.",
    }, { status: 400 });
  }

  if (links.length > 20) {
    return NextResponse.json({
      ...publicApiError("INVALID_REQUEST"),
      error: "За один раз можно обработать не более 20 ссылок.",
    }, { status: 400 });
  }

  if (links.some((item) => !isAllowedTravelpayoutsTargetUrl(item.url))) {
    return NextResponse.json(
      {
        ...publicApiError("INVALID_REQUEST"),
        error: "Разрешены только официальные защищённые ссылки партнёров.",
      },
      { status: 400 },
    );
  }

  try {
    const result = await createTravelpayoutsPartnerLinks(links, { shorten: body.shorten });
    return NextResponse.json({ links: result });
  } catch (error) {
    if (error instanceof TravelpayoutsError) {
      return NextResponse.json(
        publicApiError("PARTNER_DATA_UNAVAILABLE"),
        { status: error.status },
      );
    }
    return NextResponse.json(publicApiError("PARTNER_DATA_UNAVAILABLE"), { status: 500 });
  }
}

export const POST = withRateLimit(postPartnerLinks, {
  limit: 10,
  window: 60_000,
  keyPrefix: "travelpayouts:links",
  key: (request) => `ip:${getClientIp(request)}`,
});
