"use client";

import { useState } from "react";
import type { BookingOrganizerComment } from "@/types/tourist";
import { addOrganizerComment } from "@/lib/bookings-store";
import { apiAddOrganizerComment, isRemoteBookingsMode } from "@/lib/bookings-api";
import { useAuth } from "@/context/AuthContext";
import { formatBookingDateTime } from "@/lib/booking-datetime";
import { Button } from "@/components/ui/button";

function NotesJournal({ comments }: { comments: BookingOrganizerComment[] }) {
  if (comments.length === 0) return null;

  return (
    <ul className="mb-4 space-y-2">
      {comments.map((comment) => {
        const { date, time } = formatBookingDateTime(comment.createdAt);
        return (
          <li
            key={comment.id}
            className="rounded-xl border border-sky/15 bg-white/80 px-3 py-2.5 text-sm text-charcoal"
          >
            <p className="leading-relaxed">{comment.text}</p>
            <p className="mt-1.5 text-xs text-slate">
              {comment.authorName} · {date}
              {time ? ` ${time}` : ""}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

export default function BookingOrganizerCommentsEditor({
  bookingId,
  comments,
  authorName,
  onUpdated,
  variant = "default",
}: {
  bookingId: string;
  comments: BookingOrganizerComment[];
  authorName: string;
  onUpdated?: () => void;
  variant?: "default" | "organizer-detail";
}) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    if (isRemoteBookingsMode()) {
      try {
        await apiAddOrganizerComment({ bookingId, text, authorName });
        setText("");
        onUpdated?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ошибка сохранения");
      } finally {
        setLoading(false);
      }
      return;
    }

    const result = addOrganizerComment({
      bookingId,
      text,
      authorName,
      actor: user,
    });

    setLoading(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }

    setText("");
    onUpdated?.();
  }

  if (variant === "organizer-detail") {
    return (
      <div className="rounded-2xl bg-sky/5 px-4 py-4 sm:px-5 sm:py-5">
        <p className="text-sm font-semibold text-charcoal">Ваши заметки</p>
        <p className="mt-0.5 text-xs text-slate">Введите текст, туристы его не увидят</p>

        <NotesJournal comments={comments} />

        <form onSubmit={handleSubmit}>
          <textarea
            id="organizer-booking-comment"
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={4}
            placeholder="Например: созвонились, места подтверждены на 12 июня"
            className="mt-3 w-full rounded-xl border border-sky/20 bg-white px-3 py-2.5 text-sm text-charcoal placeholder:text-slate/70 focus:border-sky/40 focus:outline-none focus:ring-2 focus:ring-sky/20"
          />
          {error ? (
            <p role="alert" className="mt-2 text-sm text-red-600">
              {error}
            </p>
          ) : null}
          <div className="mt-3 flex justify-end">
            <Button type="submit" size="sm" disabled={loading || !text.trim()}>
              {loading ? "Сохраняем…" : "Сохранить заметку"}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-slate">
          Организатор пока не оставлял комментариев к этой заявке.
        </div>
      ) : (
        <NotesJournal comments={comments} />
      )}

      <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <label htmlFor="organizer-booking-comment" className="block text-sm font-medium text-charcoal">
          Новый комментарий
        </label>
        <textarea
          id="organizer-booking-comment"
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={3}
          placeholder="Например: Места подтверждены"
          className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-charcoal focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        />
        {error ? (
          <p role="alert" className="mt-2 text-sm text-red-600">
            {error}
          </p>
        ) : null}
        <Button type="submit" size="sm" className="mt-3" disabled={loading || !text.trim()}>
          {loading ? "Сохраняем…" : "Добавить комментарий"}
        </Button>
      </form>
    </div>
  );
}
