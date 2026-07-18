import { NextResponse } from "next/server";
import { clientIpFromRequest } from "@/lib/admin/audit";
import { authorizeShopCatalogOwner } from "@/lib/admin/shop-catalog-auth";
import { validateShopProductDraft } from "@/lib/admin/shop-catalog-contract";
import { fetchAdminShopCatalog, mutateShopProduct } from "@/lib/admin/shop-catalog-server";
import { fetchSiteNavigation } from "@/lib/site-settings-server";

export async function GET(request: Request) {
  const auth = await authorizeShopCatalogOwner(request);
  if (!auth.ok) return auth.response;
  try {
    const [catalog, navigation] = await Promise.all([
      fetchAdminShopCatalog(),
      fetchSiteNavigation(),
    ]);
    return NextResponse.json(
      { ...catalog, moduleEnabled: navigation.showShop },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Не удалось загрузить каталог. Попробуйте обновить страницу." },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await authorizeShopCatalogOwner(request);
  if (!auth.ok) return auth.response;
  const validation = validateShopProductDraft(await request.json().catch(() => null));
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });
  const result = await mutateShopProduct({
    action: "create",
    actorId: auth.actorId,
    productId: null,
    expectedVersion: null,
    expectedUpdatedAt: null,
    draft: validation.value,
    ipAddress: clientIpFromRequest(request),
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true }, { status: 201 });
}
