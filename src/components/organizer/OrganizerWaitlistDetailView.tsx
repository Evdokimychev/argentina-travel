"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Mail, MessageCircle, Phone } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import WaitlistStatusBadge from "@/components/waitlist/WaitlistStatusBadge";
import {
  ORGANIZER_WAITLIST_TRANSITIONS,
  WAITLIST_STATUS_LABELS,
  isActiveWaitlistStatus,
} from "@/data/waitlist-statuses";
import { formatBookingCreatedAt } from "@/lib/booking-datetime";
import { formatBookingTourDates } from "@/lib/booking-display";
import {
  addWaitlistOrganizerComment,
  convertWaitlistToBooking,
  getWaitlistEntryById,
  updateWaitlistStatus,
} from "@/lib/waitlist-store";
import {
  WAITLIST_UPDATED_EVENT,
  type WaitlistEntry,
  type WaitlistStatus,
} from "@/types/waitlist";
import { BOOKINGS_UPDATED_EVENT } from "@/types/tourist";
import { cn } from "@/lib/cn";
import { cabinetCardClass, cabinetTableHeaderClass, cabinetTableWrapClass } from "@/lib/cabinet-ui";
import { useSiteFeedback } from "@/context/SiteFeedbackContext";
import { Textarea } from "@/components/ui/textarea";

interface OrganizerWaitlistDetailViewProps {
  waitlistId: string;
}

export default function OrganizerWaitlistDetailView({
  waitlistId,
}: OrganizerWaitlistDetailViewProps) {
  const { user } = useAuth();
  const feedback = useSiteFeedback();
  const [entry, setEntry] = useState<WaitlistEntry | null>(null);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    function refresh() {
      setEntry(getWaitlistEntryById(waitlistId) ?? null);
    }
    refresh();
    window.addEventListener(WAITLIST_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(WAITLIST_UPDATED_EVENT, refresh);
  }, [waitlistId]);

  if (!entry) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
        <p className="font-medium text-charcoal">Заявка не найдена</p>
        <Link href="/organizer/bookings?tab=waitlist" className="mt-4 inline-block text-sm text-sky">
          ← К листу ожидания
        </Link>
      </div>
    );
  }

  const transitions =
    entry.status in ORGANIZER_WAITLIST_TRANSITIONS
      ? ORGANIZER_WAITLIST_TRANSITIONS[
          entry.status as keyof typeof ORGANIZER_WAITLIST_TRANSITIONS
        ]
      : [];

  async function handleStatus(next: WaitlistStatus) {
    setBusy(true);
    const result = updateWaitlistStatus({
      waitlistId: entry!.id,
      status: next,
      changedBy: "organizer",
    });
    setBusy(false);
    if ("error" in result) {
      feedback.showError({ title: "Не удалось обновить статус", description: result.error });
      return;
    }
    setEntry(result.entry);
    feedback.success({ title: "Статус обновлён", description: WAITLIST_STATUS_LABELS[next] });
  }

  async function handleConvert() {
    setBusy(true);
    const result = convertWaitlistToBooking({
      waitlistId: entry!.id,
      actor: user,
      organizerName: user?.fullName ?? user?.email,
    });
    setBusy(false);
    if ("error" in result) {
      feedback.showError({ title: "Не удалось оформить бронирование", description: result.error });
      return;
    }
    setEntry(result.entry);
    window.dispatchEvent(new CustomEvent(BOOKINGS_UPDATED_EVENT));
    feedback.success({
      title: "Бронирование создано",
      description: "Заявка переведена в раздел «Заявки» со статусом «В обработке».",
      action: { label: "Открыть бронирование", href: `/organizer/bookings/${result.bookingId}` },
    });
  }

  async function handleComment() {
    if (!comment.trim()) return;
    setBusy(true);
    const result = addWaitlistOrganizerComment({
      waitlistId: entry!.id,
      text: comment,
      authorName: user?.fullName ?? user?.email ?? "Организатор",
    });
    setBusy(false);
    if ("error" in result) {
      feedback.showError({ title: "Не удалось сохранить комментарий", description: result.error });
      return;
    }
    setEntry(result.entry);
    setComment("");
  }

  return (
    <div className="space-y-6">
      <Link
        href="/organizer/bookings?tab=waitlist"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate hover:text-charcoal"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Лист ожидания
      </Link>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-start">
          <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-gray-100">
            <Image src={entry.tourImage} alt="" fill className="object-cover" sizes="112px" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-xl font-bold text-charcoal sm:text-2xl">
                {entry.contactName || entry.contactEmail}
              </h1>
              <WaitlistStatusBadge status={entry.status} />
            </div>
            <p className="mt-1 text-sm text-slate">{entry.tourTitle}</p>
            <p className="mt-1 text-xs text-slate">
              Заявка от {formatBookingCreatedAt(entry.createdAt)} ·{" "}
              {formatBookingTourDates(entry, "Даты по согласованию")} · {entry.guests} гостей
            </p>
          </div>
        </div>

        <div className="grid gap-6 p-5 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <section>
              <h2 className="font-heading text-base font-bold text-charcoal">Контакты</h2>
              <ul className="mt-3 space-y-2 text-sm text-charcoal">
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate" aria-hidden />
                  {entry.contactEmail}
                </li>
                {entry.contactPhone ? (
                  <li className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate" aria-hidden />
                    {entry.contactPhone}
                  </li>
                ) : null}
              </ul>
            </section>

            {entry.touristComment ? (
              <section className="rounded-xl bg-gray-50 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-slate">
                  Комментарий туриста
                </p>
                <p className="mt-1 text-sm text-charcoal">{entry.touristComment}</p>
              </section>
            ) : null}

            {entry.organizerComments.length > 0 ? (
              <section>
                <h2 className="font-heading text-base font-bold text-charcoal">
                  Заметки организатора
                </h2>
                <ul className="mt-3 space-y-2">
                  {entry.organizerComments.map((item) => (
                    <li
                      key={item.id}
                      className="rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm"
                    >
                      <p className="text-charcoal">{item.text}</p>
                      <p className="mt-1 text-xs text-slate">
                        {item.authorName} · {formatBookingCreatedAt(item.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section>
              <label htmlFor="wl-organizer-comment" className="block text-sm font-medium text-charcoal">
                Добавить заметку
              </label>
              <Textarea
                id="wl-organizer-comment"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows={3}
                className="mt-2"
                placeholder="Например: место может освободиться после 15 числа"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                loading={busy}
                onClick={handleComment}
              >
                Сохранить заметку
              </Button>
            </section>
          </div>

          <aside className="space-y-4">
            {isActiveWaitlistStatus(entry.status) ? (
              <div className="rounded-2xl border border-violet-100 bg-violet-50/50 p-4">
                <p className="text-sm font-semibold text-charcoal">Действия</p>
                <p className="mt-1 text-xs leading-relaxed text-slate">
                  Когда место освободится или группа наберётся — предложите бронирование туристу.
                </p>
                <div className="mt-4 space-y-2">
                  {transitions.map((status) => (
                    <Button
                      key={status}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      disabled={busy}
                      onClick={() => handleStatus(status)}
                    >
                      {WAITLIST_STATUS_LABELS[status]}
                    </Button>
                  ))}
                  <Button
                    type="button"
                    size="sm"
                    className="w-full"
                    disabled={busy}
                    onClick={handleConvert}
                  >
                    Оформить бронирование
                  </Button>
                </div>
              </div>
            ) : null}

            {entry.convertedBookingId ? (
              <Link
                href={`/organizer/bookings/${entry.convertedBookingId}`}
                className={cn(
                  "flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-sm font-medium text-emerald-900"
                )}
              >
                <MessageCircle className="h-4 w-4" aria-hidden />
                Открыть бронирование
              </Link>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  );
}
