import { NextResponse } from "next/server";
import { clientIpFromRequest } from "@/lib/admin/audit";
import {
  assertStaffTargetMutationAllowed,
  authorizeStaffManagementRequest,
  fetchStaffSecurityRecord,
  hasConsistentOwnerGrant,
  isAdminPresetId,
  parseAdminCapabilities,
} from "@/lib/admin/staff-management";

type PatchBody = {
  preset?: unknown;
  capabilities?: unknown;
  isActive?: unknown;
  notes?: unknown;
  expectedVersion?: unknown;
};

function mutationError(error: { message: string }) {
  if (error.message.includes("STAFF_CONFLICT")) {
    return NextResponse.json(
      { error: "Доступ уже изменён в другой вкладке. Обновите список." },
      { status: 409 },
    );
  }
  if (error.message.includes("OWNER_STAFF_MUTATION_FORBIDDEN")) {
    return NextResponse.json(
      { error: "Назначение владельца защищено от изменения." },
      { status: 409 },
    );
  }
  return NextResponse.json(
    { error: "Не удалось изменить доступ. Действующие права сохранены." },
    { status: 409 },
  );
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const access = await authorizeStaffManagementRequest(request);
  if (!access.ok) return access.response;

  const { userId } = await context.params;
  const body = (await request.json().catch(() => null)) as PatchBody | null;
  if (!body) {
    return NextResponse.json({ error: "Проверьте данные формы" }, { status: 400 });
  }
  const { auth, supabase } = access;
  const current = await fetchStaffSecurityRecord(supabase, userId);
  if (!current) {
    return NextResponse.json({ error: "Сотрудник не найден" }, { status: 404 });
  }
  const targetGuard = assertStaffTargetMutationAllowed({ actorId: auth.actorId, target: current });
  if (!targetGuard.ok) {
    return NextResponse.json(
      { error: targetGuard.error, code: targetGuard.code },
      { status: targetGuard.status },
    );
  }

  if (!Number.isSafeInteger(body.expectedVersion) || body.expectedVersion !== current.rowVersion) {
    return NextResponse.json(
      { error: "Доступ уже изменён. Обновите список и повторите действие." },
      { status: 409 },
    );
  }
  let nextPreset = current.preset ?? "support_agent";
  if (body.preset !== undefined) {
    if (!isAdminPresetId(body.preset)) {
      return NextResponse.json({ error: "Неизвестный preset" }, { status: 400 });
    }
    nextPreset = body.preset;
  }
  let nextCapabilities = current.capabilities;
  if (body.capabilities !== undefined) {
    const parsedCapabilities = parseAdminCapabilities(body.capabilities);
    if (!parsedCapabilities.ok) {
      return NextResponse.json({ error: parsedCapabilities.error }, { status: 400 });
    }
    nextCapabilities = parsedCapabilities.capabilities;
  }
  let nextIsActive = current.isActive;
  if (body.isActive !== undefined) {
    if (typeof body.isActive !== "boolean") {
      return NextResponse.json({ error: "Статус доступа должен быть указан явно" }, { status: 400 });
    }
    nextIsActive = body.isActive;
  }
  let nextNotes = current.notes;
  if (body.notes !== undefined) {
    if (typeof body.notes !== "string") {
      return NextResponse.json({ error: "Заметка должна быть текстом" }, { status: 400 });
    }
    if (body.notes.trim().length > 5000) {
      return NextResponse.json({ error: "Заметка не должна превышать 5000 символов" }, { status: 400 });
    }
    nextNotes = body.notes.trim() || null;
  }

  if (
    body.preset === undefined &&
    body.capabilities === undefined &&
    body.isActive === undefined &&
    body.notes === undefined
  ) {
    return NextResponse.json({ error: "Нет данных для обновления" }, { status: 400 });
  }
  const nextRecord = {
    ...current,
    preset: nextPreset,
    capabilities: nextCapabilities,
    isActive: nextIsActive,
  };
  if (!hasConsistentOwnerGrant(nextRecord)) {
    return NextResponse.json(
      { error: "super_admin требует явный wildcard; wildcard допустим только для super_admin" },
      { status: 400 },
    );
  }

  const { error } = await supabase.rpc("admin_update_staff_atomic", {
    p_actor_user_id: auth.actorId,
    p_target_user_id: userId,
    p_expected_version: current.rowVersion,
    p_preset: nextPreset,
    p_capabilities: nextCapabilities,
    p_is_active: nextIsActive,
    p_notes: nextNotes,
    p_ip_address: clientIpFromRequest(request),
  });
  if (error) return mutationError(error);

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const access = await authorizeStaffManagementRequest(request);
  if (!access.ok) return access.response;

  const { userId } = await context.params;
  const { auth, supabase } = access;
  const current = await fetchStaffSecurityRecord(supabase, userId);
  if (!current) {
    return NextResponse.json({ error: "Сотрудник не найден" }, { status: 404 });
  }
  const targetGuard = assertStaffTargetMutationAllowed({ actorId: auth.actorId, target: current });
  if (!targetGuard.ok) {
    return NextResponse.json(
      { error: targetGuard.error, code: targetGuard.code },
      { status: targetGuard.status },
    );
  }

  const { error } = await supabase.rpc("admin_remove_staff_atomic", {
    p_actor_user_id: auth.actorId,
    p_target_user_id: userId,
    p_expected_version: current.rowVersion,
    p_ip_address: clientIpFromRequest(request),
  });
  if (error) return mutationError(error);

  return NextResponse.json({ ok: true });
}
