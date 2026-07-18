import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}

export async function authorizeShopCatalogOwner(request: Request) {
  const auth = await authorizeAdminRequest(request, "operations.shop");
  if (!auth.ok) return auth;
  if (auth.via !== "session" || !isUuid(auth.actorId)) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "Для управления каталогом войдите в административную учётную запись" },
        { status: 403 },
      ),
    };
  }
  return auth;
}
