import { NextResponse } from "next/server";
import { isSupabaseToursEnabled } from "@/lib/auth-mode";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  createGroupTripListing,
  listGroupTrips,
  listGroupTripsForMember,
} from "@/lib/group-trips-server";
import type { CreateGroupTripListingInput } from "@/types/group-trips";

export async function GET(request: Request) {
  if (!isSupabaseToursEnabled()) {
    return NextResponse.json({ listings: [] });
  }

  try {
    const url = new URL(request.url);
    const tourId = url.searchParams.get("tourId")?.trim() || undefined;
    const slotDate = url.searchParams.get("slotDate")?.trim() || undefined;
    const mine = url.searchParams.get("mine") === "1";
    const organizer = url.searchParams.get("organizer") === "1";

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const admin = createSupabaseAdminClient();

    if (mine) {
      if (!user) {
        return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 });
      }
      const listings = await listGroupTripsForMember(admin, user.id);
      return NextResponse.json({ listings });
    }

    if (organizer) {
      if (!user) {
        return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 });
      }
      const listings = await listGroupTrips(admin, {
        organizerId: user.id,
        viewerUserId: user.id,
        includeMembers: true,
      });
      return NextResponse.json({ listings });
    }

    const listings = await listGroupTrips(admin, {
      tourId,
      slotDate,
      viewerUserId: user?.id ?? null,
      includeMembers: Boolean(user),
    });

    return NextResponse.json({ listings });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!isSupabaseToursEnabled()) {
    return NextResponse.json({ error: "Набор группы недоступен" }, { status: 503 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 });
    }

    const body = (await request.json()) as CreateGroupTripListingInput;
    const admin = createSupabaseAdminClient();
    const result = await createGroupTripListing(admin, user.id, body);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ listing: result.listing });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
