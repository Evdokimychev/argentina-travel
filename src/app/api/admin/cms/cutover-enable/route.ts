import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { clientIpFromRequest, writeAdminAuditLog } from "@/lib/admin/audit";
import {
  CmsCutoverNotReadyError,
  fetchCmsCutoverReadiness,
  setCmsCutoverFlags,
} from "@/lib/cms/cms-cutover";

type Body = {
  blog?: boolean;
  guide?: boolean;
  destination?: boolean;
  place?: boolean;
};

export async function POST(request: Request) {
  const auth = await authorizeAdminRequest(request, "system.settings");
  if (!auth.ok) return auth.response;

  const body = (await request.json().catch(() => ({}))) as Body;

  if (
    body.blog === undefined &&
    body.guide === undefined &&
    body.destination === undefined &&
    body.place === undefined
  ) {
    return NextResponse.json(
      {
        error:
          "Укажите blog, guide, destination и/или place (true — CMS-only, false — hybrid)",
      },
      { status: 400 }
    );
  }

  try {
    const readiness = await setCmsCutoverFlags(
      {
        blog: body.blog,
        guide: body.guide,
        destination: body.destination,
        place: body.place,
      },
      auth.actorId
    );

    await writeAdminAuditLog({
      actorUserId: auth.actorId,
      action: "cms.cutover_enable",
      entityType: "site_settings",
      entityId: "site.features",
      payload: {
        blog: body.blog,
        guide: body.guide,
        destination: body.destination,
        place: body.place,
        readiness: Object.fromEntries(
          (["blog", "guide", "destination", "place"] as const).map((lane) => [
            lane,
            {
              cutover: readiness[lane].cutover,
              coveragePercent: readiness[lane].coveragePercent,
            },
          ])
        ),
      },
      ipAddress: clientIpFromRequest(request),
    });

    return NextResponse.json({
      ok: true,
      readiness,
      message: "Флаги cutover обновлены",
    });
  } catch (error) {
    if (error instanceof CmsCutoverNotReadyError) {
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
          lane: error.lane,
          missingSlugs: error.missingSlugs,
        },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Ошибка cutover";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
