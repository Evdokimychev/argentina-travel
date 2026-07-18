import { NextResponse } from "next/server";
import { clientIpFromRequest } from "@/lib/admin/audit";
import { authorizeShopCatalogOwner, isUuid } from "@/lib/admin/shop-catalog-auth";
import { validateShopCategoryDraft } from "@/lib/admin/shop-catalog-contract";
import { mutateShopCategory } from "@/lib/admin/shop-catalog-server";

function expectedVersion(value: unknown): number | null {
  return Number.isSafeInteger(value) && (value as number) > 0 ? value as number : null;
}

function expectedUpdatedAt(value: unknown): string | null {
  return typeof value === "string" && Number.isFinite(Date.parse(value)) ? value : null;
}

export async function POST(request: Request) {
  const auth = await authorizeShopCatalogOwner(request);
  if (!auth.ok) return auth.response;
  const validation = validateShopCategoryDraft(await request.json().catch(() => null));
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });
  const result = await mutateShopCategory({
    action: "create", actorId: auth.actorId, categoryId: null,
    expectedVersion: null, expectedUpdatedAt: null, draft: validation.value,
    ipAddress: clientIpFromRequest(request),
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function PATCH(request: Request) {
  const auth = await authorizeShopCatalogOwner(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const version = expectedVersion(body?.expectedVersion);
  const updatedAt = expectedUpdatedAt(body?.expectedUpdatedAt);
  if (!body || !isUuid(body.id) || !version || !updatedAt) {
    return NextResponse.json({ error: "Обновите страницу перед сохранением" }, { status: 400 });
  }
  const validation = validateShopCategoryDraft(body);
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });
  const result = await mutateShopCategory({
    action: "update", actorId: auth.actorId, categoryId: body.id,
    expectedVersion: version, expectedUpdatedAt: updatedAt, draft: validation.value,
    ipAddress: clientIpFromRequest(request),
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const auth = await authorizeShopCatalogOwner(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const version = expectedVersion(body?.expectedVersion);
  const updatedAt = expectedUpdatedAt(body?.expectedUpdatedAt);
  if (!body || !isUuid(body.id) || !version || !updatedAt) {
    return NextResponse.json({ error: "Обновите страницу перед архивацией" }, { status: 400 });
  }
  const result = await mutateShopCategory({
    action: "archive", actorId: auth.actorId, categoryId: body.id,
    expectedVersion: version, expectedUpdatedAt: updatedAt, draft: null,
    ipAddress: clientIpFromRequest(request),
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true });
}
