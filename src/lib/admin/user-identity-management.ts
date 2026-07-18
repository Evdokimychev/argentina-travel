import type { AccountRoleDb } from "@/types/database";

export const USER_MANAGEABLE_ROLES = ["tourist", "organizer"] as const;

type UserManageableRole = (typeof USER_MANAGEABLE_ROLES)[number];

export type UserIdentityPatch = {
  isBlocked?: boolean;
  roles?: UserManageableRole[];
  activeRole?: UserManageableRole;
  adminNotes?: string | null;
};

type ParseResult =
  | { ok: true; value: UserIdentityPatch }
  | { ok: false; error: string; code: string };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ALLOWED_FIELDS = new Set(["isBlocked", "roles", "activeRole", "adminNotes"]);
const MANAGEABLE_ROLE_SET = new Set<string>(USER_MANAGEABLE_ROLES);

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

export function parseUserIdentityPatch(input: unknown): ParseResult {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, error: "Тело запроса должно быть объектом", code: "INVALID_BODY" };
  }

  const record = input as Record<string, unknown>;
  const unknownField = Object.keys(record).find((key) => !ALLOWED_FIELDS.has(key));
  if (unknownField) {
    return {
      ok: false,
      error: `Неизвестное поле: ${unknownField}`,
      code: "UNKNOWN_FIELD",
    };
  }

  const patch: UserIdentityPatch = {};

  if (record.isBlocked !== undefined) {
    if (typeof record.isBlocked !== "boolean") {
      return {
        ok: false,
        error: "isBlocked должен быть логическим значением",
        code: "INVALID_BLOCK_STATUS",
      };
    }
    patch.isBlocked = record.isBlocked;
  }

  if (record.roles !== undefined) {
    if (!Array.isArray(record.roles) || record.roles.length === 0) {
      return {
        ok: false,
        error: "У пользователя должна остаться хотя бы одна роль",
        code: "INVALID_ROLES",
      };
    }
    if (
      record.roles.some(
        (role) => typeof role !== "string" || !MANAGEABLE_ROLE_SET.has(role),
      )
    ) {
      return {
        ok: false,
        error: "В этом разделе доступны только роли туриста и организатора",
        code: "ROLE_NOT_MANAGEABLE",
      };
    }
    patch.roles = [...new Set(record.roles)] as UserManageableRole[];
  }

  if (record.activeRole !== undefined) {
    if (typeof record.activeRole !== "string" || !MANAGEABLE_ROLE_SET.has(record.activeRole)) {
      return {
        ok: false,
        error: "Недопустимая активная роль",
        code: "ACTIVE_ROLE_NOT_MANAGEABLE",
      };
    }
    patch.activeRole = record.activeRole as UserManageableRole;
  }

  if (record.adminNotes !== undefined) {
    if (record.adminNotes !== null && typeof record.adminNotes !== "string") {
      return {
        ok: false,
        error: "adminNotes должен быть строкой или null",
        code: "INVALID_ADMIN_NOTES",
      };
    }
    const normalized = typeof record.adminNotes === "string" ? record.adminNotes.trim() : null;
    if (normalized && normalized.length > 5000) {
      return {
        ok: false,
        error: "Заметка не должна превышать 5000 символов",
        code: "ADMIN_NOTES_TOO_LONG",
      };
    }
    patch.adminNotes = normalized || null;
  }

  if (Object.keys(patch).length === 0) {
    return { ok: false, error: "Нет полей для обновления", code: "EMPTY_PATCH" };
  }

  return { ok: true, value: patch };
}

export function hasIdentitySecurityMutation(patch: UserIdentityPatch): boolean {
  return patch.isBlocked !== undefined || patch.roles !== undefined || patch.activeRole !== undefined;
}

export function guardUserIdentityTarget(input: {
  actorId: string;
  targetId: string;
  targetRoles: readonly AccountRoleDb[];
  hasStaffAssignment: boolean;
  patch: UserIdentityPatch;
}): { ok: true } | { ok: false; status: 403 | 409; error: string; code: string } {
  if (!hasIdentitySecurityMutation(input.patch)) return { ok: true };

  if (input.actorId === input.targetId) {
    return {
      ok: false,
      status: 403,
      error: "Нельзя изменять собственные роли или блокировать свою учётную запись.",
      code: "SELF_IDENTITY_MUTATION_FORBIDDEN",
    };
  }

  if (input.hasStaffAssignment || input.targetRoles.includes("admin")) {
    return {
      ok: false,
      status: 409,
      error: "Администраторы управляются только в разделе «Команда и доступы».",
      code: "ADMIN_IDENTITY_MANAGED_IN_STAFF",
    };
  }

  return { ok: true };
}
