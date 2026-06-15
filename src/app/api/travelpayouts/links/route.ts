import { NextResponse } from "next/server";
import {
  createTravelpayoutsPartnerLinks,
  isTravelpayoutsConfigured,
  TravelpayoutsError,
} from "@/lib/travelpayouts";

type CreateLinksBody = {
  links?: Array<{ url?: string; subId?: string }>;
  shorten?: boolean;
};

export async function POST(request: Request) {
  if (!isTravelpayoutsConfigured()) {
    return NextResponse.json(
      { error: "Travelpayouts is not configured on the server" },
      { status: 503 }
    );
  }

  let body: CreateLinksBody;
  try {
    body = (await request.json()) as CreateLinksBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const links = (body.links ?? [])
    .map((item) => ({
      url: item.url?.trim() ?? "",
      subId: item.subId?.trim() || undefined,
    }))
    .filter((item) => item.url.length > 0);

  if (!links.length) {
    return NextResponse.json({ error: "At least one valid url is required" }, { status: 400 });
  }

  if (links.length > 20) {
    return NextResponse.json({ error: "Maximum 20 links per request" }, { status: 400 });
  }

  try {
    const result = await createTravelpayoutsPartnerLinks(links, { shorten: body.shorten });
    return NextResponse.json({ links: result });
  } catch (error) {
    if (error instanceof TravelpayoutsError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Failed to create partner links" }, { status: 500 });
  }
}
