import { NextResponse } from "next/server";
import { isSupabaseToursEnabled } from "@/lib/auth-mode";
import { handlePublicApiRequest, publicApiJson } from "@/lib/public-api/handlers";
import { serializePublicTourDetail } from "@/lib/public-api/serializers";
import { fetchTourDetailBySlug } from "@/lib/tour-content-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(request: Request, context: RouteContext) {
  return handlePublicApiRequest(request, "tours:read", async (_req, { key }) => {
    if (!isSupabaseToursEnabled()) {
      return publicApiJson({ error: "Tours API unavailable" }, { status: 503 });
    }

    const { slug } = await context.params;
    const supabase = await createSupabaseServerClient();
    const tour = await fetchTourDetailBySlug(supabase, slug);

    if (!tour) {
      return publicApiJson({ error: "Тур не найден" }, { status: 404 });
    }

    if (key.organizerId) {
      const ownerId = tour.organizer.ownerUserId ?? tour.organizer.slug;
      if (ownerId !== key.organizerId && tour.organizer.slug !== key.organizerId) {
        return publicApiJson({ error: "Тур не найден" }, { status: 404 });
      }
    }

    return publicApiJson({ data: serializePublicTourDetail(tour) });
  });
}

export async function OPTIONS(request: Request) {
  return handlePublicApiRequest(request, "tours:read", async () => NextResponse.json({ ok: true }));
}
