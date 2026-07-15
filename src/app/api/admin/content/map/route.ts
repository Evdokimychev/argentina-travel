import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { clientIpFromRequest, writeAdminAuditLog } from "@/lib/admin/audit";
import { fetchMapObjects } from "@/lib/map-objects-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function boundedNumber(value: unknown, min: number, max: number, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "content.edit");
  if (!auth.ok) return auth.response;

  const payload = await fetchMapObjects({ limit: 500 });
  return NextResponse.json({ items: payload.objects });
}

type PatchBody = {
  objectId?: string;
  latitude?: number;
  longitude?: number;
  importance?: number;
  featured?: boolean;
  editorialPriority?: number;
  qualityScore?: number;
  source?: string;
  sourceUrl?: string;
  sourceVerifiedAt?: string;
  minZoom?: number;
  maxZoom?: number;
  region?: string;
  tags?: string[];
  status?: "published" | "hidden" | "needs_review";
  curatorNote?: string;
  relatedArticleHref?: string;
  relatedTourHref?: string;
  relatedAirportIata?: string;
};

export async function PATCH(request: Request) {
  const auth = await authorizeAdminRequest(request, "content.edit");
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as PatchBody;
  const objectId = body.objectId?.trim();
  if (!objectId || objectId.length > 200) {
    return NextResponse.json({ error: "Не выбран объект карты" }, { status: 400 });
  }

  const minZoom = boundedNumber(body.minZoom, 0, 22, 3);
  const maxZoom = boundedNumber(body.maxZoom, minZoom, 22, 18);
  const payload = {
    object_id: objectId,
    latitude: body.latitude == null ? null : boundedNumber(body.latitude, -90, 90, 0),
    longitude: body.longitude == null ? null : boundedNumber(body.longitude, -180, 180, 0),
    importance: Math.round(boundedNumber(body.importance, 0, 100, 50)),
    featured: body.featured === true,
    editorial_priority: Math.round(boundedNumber(body.editorialPriority, 0, 100, 50)),
    quality_score: Math.round(boundedNumber(body.qualityScore, 0, 100, 50)),
    source: body.source?.trim() || null,
    source_url: body.sourceUrl?.trim() || null,
    source_verified_at: body.sourceVerifiedAt?.trim() || null,
    min_zoom: minZoom,
    max_zoom: maxZoom,
    region: body.region?.trim() || null,
    tags: (body.tags ?? []).map((tag) => tag.trim()).filter(Boolean).slice(0, 20),
    status: ["published", "hidden", "needs_review"].includes(body.status ?? "")
      ? body.status!
      : "published" as const,
    curator_note: body.curatorNote?.trim() || null,
    related_article_href: body.relatedArticleHref?.trim() || null,
    related_tour_href: body.relatedTourHref?.trim() || null,
    related_airport_iata: body.relatedAirportIata?.trim().toUpperCase() || null,
    updated_by: auth.actorId === "service-role" ? null : auth.actorId,
    updated_at: new Date().toISOString(),
  };

  const { error } = await createSupabaseAdminClient()
    .from("map_object_curation")
    .upsert(payload, { onConflict: "object_id" });
  if (error) return NextResponse.json({ error: "Не удалось сохранить настройки объекта" }, { status: 500 });

  await writeAdminAuditLog({
    actorUserId: auth.actorId,
    action: "map_object.update",
    entityType: "map_object_curation",
    entityId: objectId,
    payload: { status: payload.status, featured: payload.featured, importance: payload.importance },
    ipAddress: clientIpFromRequest(request),
  });

  return NextResponse.json({ ok: true });
}
