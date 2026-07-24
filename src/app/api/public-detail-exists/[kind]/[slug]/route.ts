import { NextResponse } from "next/server";
import {
  resolvePublicDetailExistence,
  type PublicDetailKind,
} from "@/lib/public-detail-existence";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ kind: string; slug: string }>;
};

const EXISTS_HEADERS = {
  "Cache-Control": "public, max-age=30, s-maxage=120, stale-while-revalidate=600",
  "X-Robots-Tag": "noindex, nofollow",
};

const MISSING_HEADERS = {
  "Cache-Control": "public, max-age=15, s-maxage=60",
  "X-Robots-Tag": "noindex, nofollow",
};

const UNAVAILABLE_HEADERS = {
  "Cache-Control": "no-store",
  "Retry-After": "60",
  "X-Robots-Tag": "noindex, nofollow",
};

const PUBLIC_DETAIL_KINDS: PublicDetailKind[] = [
  "tours",
  "excursions",
  "places",
  "blog",
  "author-articles",
];

export async function HEAD(_request: Request, context: RouteContext) {
  const { kind, slug } = await context.params;
  if (!PUBLIC_DETAIL_KINDS.includes(kind as PublicDetailKind) || !slug.trim()) {
    return new NextResponse(null, { status: 400, headers: MISSING_HEADERS });
  }

  try {
    const result = await resolvePublicDetailExistence(
      kind as PublicDetailKind,
      slug.trim(),
    );

    switch (result.status) {
      case "exists":
        return new NextResponse(null, {
          status: 204,
          headers: {
            ...EXISTS_HEADERS,
            "X-Existence-Snapshot": result.snapshotId,
          },
        });
      case "missing":
        return new NextResponse(null, {
          status: 404,
          headers: {
            ...MISSING_HEADERS,
            "X-Existence-Reason": result.reason,
          },
        });
      case "unavailable":
        return new NextResponse(null, {
          status: 503,
          headers: {
            ...UNAVAILABLE_HEADERS,
            "X-Existence-Reason": result.reason,
          },
        });
      default: {
        const _exhaustive: never = result;
        return _exhaustive;
      }
    }
  } catch {
    return new NextResponse(null, { status: 503, headers: UNAVAILABLE_HEADERS });
  }
}
