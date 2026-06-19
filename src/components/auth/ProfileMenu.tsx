"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, Heart, LayoutGrid, LogOut, Settings, User } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAuth, useHasOrganizerRole } from "@/context/AuthContext";
import { userHasRole } from "@/types/auth";
import UserAvatar from "@/components/auth/UserAvatar";

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
  const hasOrganizerRole = useHasOrganizerRole(user);
  const [open, setOpen] = useState(false);
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
        className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-charcoal/[0.04] px-2.5 text-sm font-medium text-charcoal ring-1 ring-charcoal/10 transition-colors hover:bg-sky/5 hover:text-sky hover:ring-sky/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40 sm:px-3"
      >
        <User className="h-4 w-4 shrink-0 text-slate" strokeWidth={1.75} />
        <span className="hidden sm:inline">Войти</span>
      </button>
    );
  }

  const firstName = getFirstName(user.fullName);

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
          className="absolute right-0 top-[calc(100%+0.5rem)] z-[60] w-[min(280px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-gray-200 bg-white p-2 shadow-xl"
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
            <MenuItem
              href="/profile"
              icon={User}
              label="Личный кабинет"
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
