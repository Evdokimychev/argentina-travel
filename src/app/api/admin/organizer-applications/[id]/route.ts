import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { clientIpFromRequest, writeAdminAuditLog } from "@/lib/admin/audit";
import { notifyOrganizerApplicationReview } from "@/lib/admin/moderation-notify";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type PatchBody = {
  action?: "approve" | "reject";
  note?: string;
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeAdminRequest(request, "marketplace.moderation");
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const body = (await request.json()) as PatchBody;

  if (body.action !== "approve" && body.action !== "reject") {
    return NextResponse.json({ error: "Укажите action: approve или reject" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data: application, error } = await supabase
    .from("contact_submissions")
    .select("id, name, email, phone, message")
    .eq("id", id)
    .eq("kind", "organizer_application")
    .maybeSingle();

  if (error || !application) {
    return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });
  }

  if (body.action === "approve" && application.email) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, roles")
      .ilike("email", application.email)
      .maybeSingle();

    if (profile) {
      const roles = profile.roles ?? [];
      const nextRoles = roles.includes("organizer")
        ? roles
        : [...roles, "organizer" as const];
      await supabase
        .from("profiles")
        .update({ roles: nextRoles, active_role: "organizer" })
        .eq("id", profile.id);
    }
  }

  await notifyOrganizerApplicationReview({
    applicantEmail: application.email ?? "",
    applicantName: application.name,
    action: body.action,
    note: body.note,
  });

  await writeAdminAuditLog({
    actorUserId: auth.actorId,
    action: `organizer_application.${body.action}`,
    entityType: "contact_submission",
    entityId: id,
    payload: { note: body.note ?? null },
    ipAddress: clientIpFromRequest(request),
  });

  return NextResponse.json({ ok: true });
}
