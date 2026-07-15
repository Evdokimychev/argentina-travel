import type { AccountRole } from "@/types/user";
import type { ActiveWorkspace, PrimaryIntent } from "@/types/user-experience";

export const ACTIVE_WORKSPACE_COOKIE = "goargentina-active-workspace";

export const WORKSPACE_META: Record<
  ActiveWorkspace,
  { label: string; shortLabel: string; href: string; intent: PrimaryIntent }
> = {
  travel: {
    label: "Путешествия",
    shortLabel: "Мои поездки",
    href: "/profile",
    intent: "plan_trip",
  },
  organizer: {
    label: "Организатор",
    shortLabel: "Кабинет организатора",
    href: "/organizer",
    intent: "manage_offers",
  },
  admin: {
    label: "Управление сайтом",
    shortLabel: "Управление сайтом",
    href: "/admin",
    intent: "manage_platform",
  },
};

export function availableWorkspaces(roles: readonly AccountRole[]): ActiveWorkspace[] {
  const result: ActiveWorkspace[] = [];
  if (roles.some((role) => role === "tourist" || role === "organizer" || role === "admin")) {
    result.push("travel");
  }
  if (roles.includes("organizer")) result.push("organizer");
  if (roles.includes("admin")) result.push("admin");
  return result;
}

export function resolveActiveWorkspace(
  roles: readonly AccountRole[],
  preference?: string | null,
): ActiveWorkspace | null {
  const available = availableWorkspaces(roles);
  if (preference && available.includes(preference as ActiveWorkspace)) {
    return preference as ActiveWorkspace;
  }
  return available[0] ?? null;
}

export function isWorkspaceAvailable(
  roles: readonly AccountRole[],
  workspace: ActiveWorkspace,
): boolean {
  return availableWorkspaces(roles).includes(workspace);
}
