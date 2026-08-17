import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { clientIpFromRequest, writeCriticalAdminAuditLog } from "@/lib/admin/audit";
import {
  guardUserIdentityTarget,
  isUuid,
  parseUserIdentityPatch,
} from "@/lib/admin/user-identity-management";
import { revokeSupabaseAuthSessions } from "@/lib/auth-sessions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type UserUpdateRpcClient = {
  rpc(name: "admin_update_user_profile_atomic", args: Record<string, unknown>): PromiseLike<{
    data: Record<string, unknown> | null;
    error: { code?: string; message: string } | null;
  }>;
};

function errorResponse(error: string, status: number, code: string) {
  return NextResponse.json({ error, code }, { status });
}

async function setAuthBlocked(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  userId: string,
  blocked: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data, error } = await supabase.auth.admin.updateUserById(userId, {
    ban_duration: blocked ? "876000h" : "none",
  });
  if (error || data.user?.id !== userId) {
    return { ok: false, error: "Сервис входа не подтвердил изменение" };
  }
  return { ok: true };
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeAdminRequest(request, "users.manage");
  if (!auth.ok) return auth.response;
  if (auth.via !== "session") {
    return errorResponse(
      "Для управления пользователями нужна подтверждённая сессия администратора.",
      403,
      "ADMIN_SESSION_REQUIRED",
    );
  }

  const { id } = await context.params;
  if (!isUuid(id)) {
    return errorResponse("Некорректный идентификатор пользователя", 400, "INVALID_USER_ID");
  }

  const rawBody = await request.json().catch(() => null);
  const parsed = parseUserIdentityPatch(rawBody);
  if (!parsed.ok) {
    return errorResponse(parsed.error, 400, parsed.code);
  }
  const body = parsed.value;
  const supabase = createSupabaseAdminClient();

  const [profileResult, staffResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, roles, active_role, is_blocked, admin_notes, row_version")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("admin_staff").select("user_id").eq("user_id", id).maybeSingle(),
  ]);

  if (profileResult.error) {
    return errorResponse("Не удалось прочитать профиль", 500, "PROFILE_READ_FAILED");
  }
  if (!profileResult.data) {
    return errorResponse("Пользователь не найден", 404, "USER_NOT_FOUND");
  }
  if (staffResult.error) {
    return errorResponse("Не удалось проверить доступы команды", 500, "STAFF_CHECK_FAILED");
  }

  const current = profileResult.data;
  const targetGuard = guardUserIdentityTarget({
    actorId: auth.actorId,
    targetId: id,
    targetRoles: current.roles,
    hasStaffAssignment: Boolean(staffResult.data),
    patch: body,
  });
  if (!targetGuard.ok) {
    return errorResponse(targetGuard.error, targetGuard.status, targetGuard.code);
  }

  const nextRoles = body.roles ?? current.roles;
  const nextActiveRole =
    body.activeRole ??
    (nextRoles.includes(current.active_role) ? current.active_role : nextRoles[0]);
  if (!nextRoles.includes(nextActiveRole)) {
    return errorResponse(
      "Активная роль должна входить в список назначенных ролей",
      400,
      "ACTIVE_ROLE_NOT_GRANTED",
    );
  }

  const grantsOrganizer =
    nextRoles.includes("organizer") && !current.roles.includes("organizer");
  if (grantsOrganizer) {
    const { data: approvedApplication, error: applicationError } = await supabase
      .from("organizer_applications")
      .select("id")
      .eq("user_id", id)
      .eq("status", "approved")
      .limit(1)
      .maybeSingle();
    if (applicationError) {
      return errorResponse(
        "Не удалось проверить заявку организатора",
        500,
        "ORGANIZER_APPROVAL_CHECK_FAILED",
      );
    }
    if (!approvedApplication) {
      return errorResponse(
        "Роль организатора выдаётся только после одобрения заявки.",
        409,
        "ORGANIZER_APPROVAL_REQUIRED",
      );
    }
  }

  const authBlockChanged =
    body.isBlocked !== undefined && body.isBlocked !== current.is_blocked;
  if (authBlockChanged) {
    const authResult = await setAuthBlocked(supabase, id, body.isBlocked!);
    if (!authResult.ok) {
      return errorResponse(
        `Не удалось ${body.isBlocked ? "заблокировать" : "разблокировать"} вход. Попробуйте ещё раз или передайте обращение владельцу сайта.`,
        502,
        "AUTH_BLOCK_UPDATE_FAILED",
      );
    }

    if (body.isBlocked) {
      const revokeResult = await revokeSupabaseAuthSessions(id).catch(() => ({
        ok: false,
        revokedCount: 0,
      }));
      if (!revokeResult.ok) {
        const compensation = await setAuthBlocked(supabase, id, current.is_blocked);
        if (!compensation.ok) {
          return errorResponse(
            "Активные сеансы не завершены, а прежний доступ не удалось восстановить автоматически. Передайте обращение владельцу сайта и временно не повторяйте действие.",
            502,
            "AUTH_BLOCK_COMPENSATION_FAILED",
          );
        }
        return errorResponse(
          "Блокировка отменена: не удалось безопасно отозвать активные сессии.",
          503,
          "AUTH_SESSION_REVOCATION_FAILED",
        );
      }
    }
  }

  const { data: updatedProfile, error: updateError } = await (supabase as unknown as UserUpdateRpcClient).rpc(
    "admin_update_user_profile_atomic",
    {
      p_actor_user_id: auth.actorId,
      p_target_user_id: id,
      p_expected_version: current.row_version,
      p_next_roles: nextRoles,
      p_next_active_role: nextActiveRole,
      p_next_is_blocked: body.isBlocked ?? current.is_blocked,
      p_next_admin_notes: body.adminNotes !== undefined ? body.adminNotes : current.admin_notes,
      p_ip_address: clientIpFromRequest(request),
    },
  );
  if (updateError || !updatedProfile) {
    if (authBlockChanged) {
      const compensation = await setAuthBlocked(supabase, id, current.is_blocked);
      if (!compensation.ok) {
        return errorResponse(
          "Профиль не сохранён, а прежнее состояние входа не удалось восстановить автоматически. Передайте обращение владельцу сайта и временно не повторяйте действие.",
          502,
          "AUTH_BLOCK_COMPENSATION_FAILED",
        );
      }
    }
    const conflict = updateError?.code === "40001" || updateError?.message.includes("VERSION_CONFLICT");
    const approvalMissing = updateError?.message.includes("ORGANIZER_APPROVAL_REQUIRED");
    return errorResponse(
      conflict
        ? "Профиль уже изменён. Обновите страницу."
        : approvalMissing
          ? "Роль организатора выдаётся только после одобрения заявки."
          : "Не удалось безопасно сохранить профиль.",
      conflict || approvalMissing ? 409 : 503,
      conflict ? "PROFILE_UPDATE_CONFLICT" : approvalMissing ? "ORGANIZER_APPROVAL_REQUIRED" : "PROFILE_UPDATE_FAILED",
    );
  }

  if (authBlockChanged) {
    const audit = await writeCriticalAdminAuditLog({
      actorUserId: auth.actorId,
      action: body.isBlocked ? "users.block" : "users.unblock",
      entityType: "profile",
      entityId: id,
      payload: { isBlocked: Boolean(body.isBlocked) },
      ipAddress: clientIpFromRequest(request),
    });
    if (!audit.ok) {
      return errorResponse(
        "Не удалось записать журнал безопасности. Повторите позже.",
        503,
        "AUDIT_WRITE_FAILED",
      );
    }
  }

  return NextResponse.json({ ok: true });
}
