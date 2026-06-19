import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { clientIpFromRequest, writeAdminAuditLog } from "@/lib/admin/audit";
import {
  deleteTripPrepTemplate,
  fetchAllTripPrepTemplates,
  upsertTripPrepTemplate,
} from "@/lib/trip-prep-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { TripPrepCategory, TripPrepTourType } from "@/types/trip-prep";

const TOUR_TYPES = new Set<TripPrepTourType>(["default", "group", "individual", "partner"]);
const CATEGORIES = new Set<TripPrepCategory>([
  "documents",
  "connectivity",
  "money",
  "health",
  "luggage",
  "transfer",
  "organizer",
]);

function normalizeItems(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry, index) => {
      if (!entry || typeof entry !== "object") return null;
      const item = entry as Record<string, unknown>;
      const category = String(item.category ?? "").trim() as TripPrepCategory;
      const title = String(item.title ?? "").trim();
      if (!CATEGORIES.has(category) || !title) return null;
      return {
        id: typeof item.id === "string" ? item.id : undefined,
        category,
        title,
        description: typeof item.description === "string" ? item.description : null,
        sortOrder:
          typeof item.sortOrder === "number"
            ? item.sortOrder
            : typeof item.sort_order === "number"
              ? item.sort_order
              : (index + 1) * 10,
        required: item.required === true,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
}

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "content.edit");
  if (!auth.ok) return auth.response;

  const supabase = createSupabaseAdminClient();
  const items = await fetchAllTripPrepTemplates(supabase);
  return NextResponse.json({ items });
}

type PutBody = {
  id?: string;
  name?: string;
  tourType?: TripPrepTourType;
  isDefault?: boolean;
  items?: unknown;
};

export async function PUT(request: Request) {
  const auth = await authorizeAdminRequest(request, "content.edit");
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as PutBody;
  const name = body.name?.trim();
  const tourType = body.tourType;

  if (!name) {
    return NextResponse.json({ error: "Укажите название шаблона" }, { status: 400 });
  }
  if (!tourType || !TOUR_TYPES.has(tourType)) {
    return NextResponse.json({ error: "Некорректный тип тура" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const item = await upsertTripPrepTemplate(supabase, {
    id: body.id,
    name,
    tourType,
    isDefault: body.isDefault === true,
    items: normalizeItems(body.items),
  });

  if (!item) {
    return NextResponse.json({ error: "Не удалось сохранить шаблон" }, { status: 500 });
  }

  await writeAdminAuditLog({
    actorUserId: auth.actorId,
    action: body.id ? "trip_prep_template.update" : "trip_prep_template.create",
    entityType: "trip_prep_templates",
    entityId: item.id,
    payload: { name: item.name, tourType: item.tourType, itemsCount: item.items.length },
    ipAddress: clientIpFromRequest(request),
  });

  return NextResponse.json({ item });
}

type DeleteBody = {
  id?: string;
};

export async function DELETE(request: Request) {
  const auth = await authorizeAdminRequest(request, "content.edit");
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as DeleteBody;
  const id = body.id?.trim();
  if (!id) {
    return NextResponse.json({ error: "Укажите id шаблона" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const result = await deleteTripPrepTemplate(supabase, id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "Не удалось удалить" }, { status: 400 });
  }

  await writeAdminAuditLog({
    actorUserId: auth.actorId,
    action: "trip_prep_template.delete",
    entityType: "trip_prep_templates",
    entityId: id,
    ipAddress: clientIpFromRequest(request),
  });

  return NextResponse.json({ ok: true });
}
