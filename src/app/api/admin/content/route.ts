import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { buildContentInventory } from "@/lib/admin/content-inventory";

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "content.edit");
  if (!auth.ok) return auth.response;

  const inventory = buildContentInventory();
  return NextResponse.json(inventory);
}
