import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { clientIpFromRequest } from "@/lib/admin/audit";
import { setForumThreadState } from "@/lib/admin/forum-admin-server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await authorizeAdminRequest(request, "marketplace.moderation");
  if (!auth.ok) return auth.response;
  if (auth.via !== "session" || !UUID.test(auth.actorId)) {
    return NextResponse.json(
      { error: "Для управления форумом войдите в административную учётную запись" },
      { status: 403 },
    );
  }
  const { id } = await context.params;
  if (!UUID.test(id)) {
    return NextResponse.json({ error: "Некорректная тема" }, { status: 400 });
  }
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (
    !body
    || typeof body.expectedPinned !== "boolean"
    || typeof body.expectedLocked !== "boolean"
    || typeof body.nextPinned !== "boolean"
    || typeof body.nextLocked !== "boolean"
  ) {
    return NextResponse.json({ error: "Некорректное изменение темы" }, { status: 400 });
  }

  const result = await setForumThreadState({
    actorId: auth.actorId,
    threadId: id,
    expectedPinned: body.expectedPinned,
    expectedLocked: body.expectedLocked,
    nextPinned: body.nextPinned,
    nextLocked: body.nextLocked,
    ipAddress: clientIpFromRequest(request),
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true });
}
