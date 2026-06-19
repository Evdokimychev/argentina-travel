"use client";

import { UserPlus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/cn";

/**
 * Non-blocking recommendation for guests to sign in before booking.
 * Booking is fully available without an account — signing in only adds
 * profile autofill and request history.
 */
export default function BookingGuestLoginHint({ className }: { className?: string }) {
  const { isAuthenticated, openAuth } = useAuth();

  if (isAuthenticated) return null;

  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-xl border border-sky/20 bg-sky/[0.05] px-3.5 py-3",
        className
      )}
    >
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-sky shadow-sm">
        <UserPlus className="h-4 w-4" aria-hidden />
      </span>
      <p className="text-xs leading-relaxed text-charcoal">
        Можно забронировать без регистрации.{" "}
        <button
          type="button"
          onClick={() => openAuth()}
          className="font-semibold text-sky hover:underline"
        >
          Войдите
        </button>{" "}
        — заявка сохранится в личном кабинете, а контактные данные подставятся автоматически.
      </p>
    </div>
  );
}
