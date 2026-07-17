import { NextResponse } from "next/server";
import { clientIpFromRequest } from "@/lib/admin/audit";
import { authorizeShopCatalogOwner } from "@/lib/admin/shop-catalog-auth";
import { validateShopProductDraft } from "@/lib/admin/shop-catalog-contract";
import { mutateShopProduct } from "@/lib/admin/shop-catalog-server";

const PRODUCT_ID = /^shop-[a-z0-9-]{8,80}$/;

function expectedVersion(value: unknown): number | null {
  return Number.isSafeInteger(value) && (value as number) > 0 ? value as number : null;
}

function expectedUpdatedAt(value: unknown): string | null {
  return typeof value === "string" && Number.isFinite(Date.parse(value)) ? value : null;
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await authorizeShopCatalogOwner(request);
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  if (!PRODUCT_ID.test(id)) return NextResponse.json({ error: "Некорректный товар" }, { status: 400 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const version = expectedVersion(body?.expectedVersion);
  const updatedAt = expectedUpdatedAt(body?.expectedUpdatedAt);
  if (!version || !updatedAt) {
    return NextResponse.json({ error: "Обновите страницу перед сохранением" }, { status: 400 });
  }
  const validation = validateShopProductDraft(body);
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });
  const result = await mutateShopProduct({
    action: "update",
    actorId: auth.actorId,
    productId: id,
    expectedVersion: version,
    expectedUpdatedAt: updatedAt,
    draft: validation.value,
    ipAddress: clientIpFromRequest(request),
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await authorizeShopCatalogOwner(request);
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  if (!PRODUCT_ID.test(id)) return NextResponse.json({ error: "Некорректный товар" }, { status: 400 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const version = expectedVersion(body?.expectedVersion);
  const updatedAt = expectedUpdatedAt(body?.expectedUpdatedAt);
  if (!version || !updatedAt) {
    return NextResponse.json({ error: "Обновите страницу перед архивацией" }, { status: 400 });
  }
  const result = await mutateShopProduct({
    action: "archive",
    actorId: auth.actorId,
    productId: id,
    expectedVersion: version,
    expectedUpdatedAt: updatedAt,
    draft: null,
    ipAddress: clientIpFromRequest(request),
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true });
}
