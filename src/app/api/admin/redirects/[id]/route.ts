import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { clientIpFromRequest, writeAdminAuditLog } from "@/lib/admin/audit";
import {
  deleteUrlRedirect,
  updateUrlRedirect,
} from "@/lib/redirects/url-redirect-server";
import type { UrlRedirectInput } from "@/types/url-redirect";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await authorizeAdminRequest(request, "system.settings");
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const body = (await request.json()) as Partial<UrlRedirectInput>;
  const result = await updateUrlRedirect(id, body, auth.actorId);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  await writeAdminAuditLog({
    actorUserId: auth.actorId,
    action: "redirects.update",
    entityType: "url_redirect",
    entityId: id,
    payload: body,
    ipAddress: clientIpFromRequest(request),
  });

  return NextResponse.json({ redirect: result.redirect });
}

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await authorizeAdminRequest(request, "system.settings");
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const result = await deleteUrlRedirect(id);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  await writeAdminAuditLog({
    actorUserId: auth.actorId,
    action: "redirects.delete",
    entityType: "url_redirect",
    entityId: id,
    ipAddress: clientIpFromRequest(request),
  });

  return NextResponse.json({ ok: true });
}
