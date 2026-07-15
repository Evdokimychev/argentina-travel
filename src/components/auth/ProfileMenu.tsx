"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  BriefcaseBusiness,
  Check,
  ChevronDown,
  Heart,
  LayoutGrid,
  LogOut,
  Plane,
  Settings,
  ShieldCheck,
  User,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useAuth, useHasOrganizerRole } from "@/context/AuthContext";
import { userHasRole } from "@/types/auth";
import UserAvatar from "@/components/auth/UserAvatar";
import { tokenFocusRingClass, tokenHeaderCircleButtonClass } from "@/lib/design-tokens";
import { useUserExperience } from "@/context/UserExperienceContext";
import { availableWorkspaces, WORKSPACE_META } from "@/lib/user-experience/workspaces";
import type { ActiveWorkspace } from "@/types/user-experience";

function getFirstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || fullName;
}

function MenuItem({
  href,
  onClick,
  icon: Icon,
  label,
  tone = "default",
}: {
  href?: string;
  onClick?: () => void;
  icon: typeof Settings;
  label: string;
  tone?: "default" | "danger";
}) {
  const className = cn(
    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors",
    tone === "danger"
      ? "text-charcoal hover:bg-red-50 hover:text-red-700"
      : "text-charcoal hover:bg-gray-50"
  );

  const content = (
    <>
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          tone === "danger" ? "bg-red-50 text-red-600" : "bg-gray-100 text-slate"
        )}
      >
        <Icon className="h-4 w-4" strokeWidth={1.75} />
      </span>
      <span>{label}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} role="menuitem" onClick={onClick} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" role="menuitem" onClick={onClick} className={className}>
      {content}
    </button>
  );
}

export default function ProfileMenu() {
  const { isAuthenticated, user, openAuth, logout } = useAuth();
  const { experience, loading: experienceLoading, switchWorkspace } = useUserExperience();
  const hasOrganizerRole = useHasOrganizerRole(user);
  const [open, setOpen] = useState(false);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  if (!isAuthenticated || !user) {
    return (
      <button
        type="button"
        onClick={() => openAuth()}
        aria-label="Войти в профиль"
        className={cn(
          tokenHeaderCircleButtonClass,
          tokenFocusRingClass,
          "sm:w-auto sm:gap-1.5 sm:px-3 sm:text-sm sm:font-medium",
        )}
      >
        <User className="h-4 w-4 shrink-0 text-slate sm:text-inherit" strokeWidth={1.75} />
        <span className="hidden sm:inline">Войти</span>
      </button>
    );
  }

  const firstName = getFirstName(user.fullName);
  const workspaces = availableWorkspaces(experience.roles);
  const workspaceIcons: Record<ActiveWorkspace, typeof Plane> = {
    travel: Plane,
    organizer: BriefcaseBusiness,
    admin: ShieldCheck,
  };

  async function handleWorkspaceChange(workspace: ActiveWorkspace) {
    setWorkspaceError(null);
    const result = await switchWorkspace(workspace);
    if (!result.ok) {
      setWorkspaceError(result.error ?? "Не удалось переключить режим");
      return;
    }
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Профиль: ${firstName}`}
        className={cn(
          "flex h-10 items-center gap-2 rounded-full py-1 pl-1 pr-2 ring-1 transition-[background-color,box-shadow,ring-color] sm:pr-2.5",
          open
            ? "bg-white shadow-sm ring-sky/25"
            : "bg-charcoal/[0.04] ring-charcoal/10 hover:bg-sky/5 hover:ring-sky/25"
        )}
      >
        <UserAvatar
          name={user.fullName}
          avatarUrl={user.avatarUrl}
          className="h-9 w-9 text-sm"
        />
        <span className="hidden max-w-[88px] truncate text-sm font-semibold text-charcoal sm:inline">
          {firstName}
        </span>
        <ChevronDown
          className={cn(
            "hidden h-4 w-4 text-slate transition-transform sm:block",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-overlay max-sm:fixed max-sm:inset-x-4 max-sm:top-auto max-sm:bottom-[max(1rem,env(safe-area-inset-bottom,0px))] max-sm:w-auto max-sm:max-h-[min(70dvh,calc(100dvh-env(keyboard-inset-height,0px)-6rem))] max-sm:overflow-y-auto w-[min(320px,calc(100dvw-2rem))] overflow-hidden rounded-2xl border border-gray-200 bg-white p-2 shadow-xl"
        >
          <div className="rounded-xl bg-gray-50 px-3 py-3">
            <div className="flex items-center gap-3">
              <UserAvatar
                name={user.fullName}
                avatarUrl={user.avatarUrl}
                className="h-11 w-11 text-sm"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-charcoal">{user.fullName}</p>
                <p className="truncate text-xs text-slate">{user.email}</p>
              </div>
            </div>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {userHasRole(user, "tourist") ? (
                <span className="rounded-full bg-sky/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky">
                  Турист
                </span>
              ) : null}
              {hasOrganizerRole ? (
                <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand">
                  Организатор
                </span>
              ) : null}
            </div>
          </div>

          <div className="mt-1 space-y-0.5 px-1 py-1">
            {workspaces.length > 1 ? (
              <div className="mb-1 border-b border-gray-100 pb-2">
                <p className="px-3 pb-1.5 pt-1 text-[11px] font-semibold uppercase text-slate">
                  Рабочее пространство
                </p>
                {workspaces.map((workspace) => {
                  const Icon = workspaceIcons[workspace];
                  const active = experience.activeWorkspace === workspace;
                  return (
                    <button
                      key={workspace}
                      type="button"
                      role="menuitemradio"
                      aria-checked={active}
                      disabled={experienceLoading}
                      onClick={() => void handleWorkspaceChange(workspace)}
                      className={cn(
                        "flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors",
                        active ? "bg-sky/10 text-sky" : "text-charcoal hover:bg-gray-50",
                      )}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/80 ring-1 ring-charcoal/5">
                        <Icon className="h-4 w-4" strokeWidth={1.75} />
                      </span>
                      <span className="min-w-0 flex-1">{WORKSPACE_META[workspace].label}</span>
                      {active ? <Check className="h-4 w-4" aria-hidden /> : null}
                    </button>
                  );
                })}
                {workspaceError ? (
                  <p className="px-3 pt-1 text-xs text-red-700" role="alert">
                    {workspaceError}
                  </p>
                ) : null}
              </div>
            ) : null}
            <MenuItem
              href="/profile"
              icon={User}
              label="Мои поездки"
              onClick={() => setOpen(false)}
            />
            <MenuItem
              href="/profile/favorites"
              icon={Heart}
              label="Избранное"
              onClick={() => setOpen(false)}
            />
            {hasOrganizerRole ? (
              <MenuItem
                href="/organizer"
                icon={LayoutGrid}
                label="Кабинет организатора"
                onClick={() => setOpen(false)}
              />
            ) : null}
            {experience.roles.includes("admin") ? (
              <MenuItem
                href="/admin"
                icon={ShieldCheck}
                label="Управление сайтом"
                onClick={() => setOpen(false)}
              />
            ) : null}
            <MenuItem
              href="/profile/settings"
              icon={Settings}
              label="Настройки профиля"
              onClick={() => setOpen(false)}
            />
          </div>

          <div className="mt-1 border-t border-gray-100 px-1 pt-1">
            <MenuItem
              icon={LogOut}
              label="Выход"
              tone="danger"
              onClick={() => {
                setOpen(false);
                logout();
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
