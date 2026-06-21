import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { clientIpFromRequest, writeAdminAuditLog } from "@/lib/admin/audit";
import {
  createUrlRedirect,
  listUrlRedirectsForAdmin,
} from "@/lib/redirects/url-redirect-server";
import type { UrlRedirectInput } from "@/types/url-redirect";

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "system.settings");
  if (!auth.ok) return auth.response;

  const redirects = await listUrlRedirectsForAdmin();
  return NextResponse.json({ redirects });
}

export async function POST(request: Request) {
  const auth = await authorizeAdminRequest(request, "system.settings");
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as UrlRedirectInput;
  const result = await createUrlRedirect(body, auth.actorId);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  await writeAdminAuditLog({
    actorUserId: auth.actorId,
    action: "redirects.create",
    entityType: "url_redirect",
    entityId: result.redirect.id,
    payload: { fromPath: result.redirect.fromPath, toPath: result.redirect.toPath },
    ipAddress: clientIpFromRequest(request),
  });

  return NextResponse.json({ redirect: result.redirect });
}
