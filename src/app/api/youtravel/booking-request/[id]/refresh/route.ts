import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { fetchYouTravelBookingRequestById } from "@/lib/youtravel/booking-requests-server";
import { refreshYouTravelBookingStatus } from "@/lib/youtravel/booking-status-sync";
import { publicApiError } from "@/lib/public-api/safe-error";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function userOwnsRequest(
  request: Awaited<ReturnType<typeof fetchYouTravelBookingRequestById>>,
  userId: string,
  email: string | null | undefined
): boolean {
  if (!request) return false;
  if (request.userId && request.userId === userId) return true;
  const normalizedEmail = email?.trim().toLowerCase();
  if (normalizedEmail && request.customerEmail.trim().toLowerCase() === normalizedEmail) {
    return true;
  }
  return false;
}

export async function POST(_request: Request, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(publicApiError("SERVICE_UNAVAILABLE"), { status: 503 });
  }

  const { id } = await context.params;
  const requestId = id?.trim();
  if (!requestId) {
    return NextResponse.json(publicApiError("INVALID_REQUEST"), { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json(publicApiError("AUTH_REQUIRED"), { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const existing = await fetchYouTravelBookingRequestById(admin, requestId);

  if (!existing) {
    return NextResponse.json(publicApiError("REQUEST_NOT_FOUND"), { status: 404 });
  }

  if (!userOwnsRequest(existing, authUser.id, authUser.email)) {
    return NextResponse.json(publicApiError("ACCESS_DENIED"), { status: 403 });
  }

  const updated = await refreshYouTravelBookingStatus(admin, requestId);
  if (!updated) {
    return NextResponse.json(publicApiError("REQUEST_NOT_FOUND"), { status: 404 });
  }

  return NextResponse.json({ request: updated });
}
