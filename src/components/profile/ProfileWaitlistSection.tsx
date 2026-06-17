"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ListOrdered } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cancelWaitlistByTourist, getUserWaitlistEntries } from "@/lib/waitlist-store";
import { WAITLIST_UPDATED_EVENT, type WaitlistEntry } from "@/types/waitlist";
import WaitlistStatusBadge from "@/components/waitlist/WaitlistStatusBadge";
import { formatBookingCreatedAt } from "@/lib/booking-datetime";
import { formatBookingTourDates } from "@/lib/booking-display";
import { isActiveWaitlistStatus } from "@/data/waitlist-statuses";
import { EmptyState } from "@/components/ui/empty-state";
import { cabinetCardClass, cabinetLinkClass } from "@/lib/cabinet-ui";

export default function ProfileWaitlistSection() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    function refresh() {
      setEntries(getUserWaitlistEntries(user!.id));
    }
    refresh();
    window.addEventListener(WAITLIST_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(WAITLIST_UPDATED_EVENT, refresh);
  }, [user]);

  if (!user) return null;

  function handleCancel(entryId: string) {
    setError(null);
    const result = cancelWaitlistByTourist(entryId, user);
    if ("error" in result) {
      setError(result.error);
    }
  }

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={ListOrdered}
        title="Вы не в листе ожидания"
        description="Если на тур не хватает мест, можно оставить заявку — организатор свяжется, когда появится возможность."
        action={{ label: "Смотреть туры", href: "/tours", variant: "outline" }}
        className="mt-6"
      />
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {error ? (
        <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {entries.map((entry) => {
        const canCancel = isActiveWaitlistStatus(entry.status);
        return (
          <article key={entry.id} className={cabinetCardClass}>
            <div className="flex flex-col sm:flex-row">
              <div className="relative aspect-[16/9] w-full sm:aspect-auto sm:h-auto sm:w-44 sm:shrink-0">
                <Image
                  src={entry.tourImage}
                  alt={entry.tourTitle}
                  fill
                  className="object-cover"
                  sizes="176px"
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/tours/${entry.tourSlug}`}
                      className="font-heading text-base font-bold text-charcoal transition-colors hover:text-sky"
                    >
                      {entry.tourTitle}
                    </Link>
                    <p className="mt-1 text-sm text-slate">
                      {formatBookingTourDates(entry, "Даты по согласованию")} · {entry.guests}{" "}
                      гостей
                    </p>
                    <p className="mt-1 text-xs text-slate">
                      Заявка от {formatBookingCreatedAt(entry.createdAt)}
                    </p>
                  </div>
                  <WaitlistStatusBadge status={entry.status} />
                </div>

                {entry.touristComment ? (
                  <p className="mt-3 text-sm text-slate">{entry.touristComment}</p>
                ) : null}

                <div className="mt-auto flex flex-wrap gap-3 pt-4">
                  {entry.convertedBookingId ? (
                    <Link
                      href={`/profile/bookings/${entry.convertedBookingId}`}
                      className={cabinetLinkClass}
                    >
                      Перейти к бронированию
                    </Link>
                  ) : null}
                  {canCancel ? (
                    <button
                      type="button"
                      onClick={() => handleCancel(entry.id)}
                      className="text-sm font-medium text-slate transition-colors hover:text-red-600"
                    >
                      Отменить заявку
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
