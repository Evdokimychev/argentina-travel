"use client";

import { useState } from "react";
import type { BookingOrganizerComment } from "@/types/tourist";
import { addOrganizerComment } from "@/lib/bookings-store";
import { useAuth } from "@/context/AuthContext";
import BookingOrganizerCommentsJournal from "./BookingOrganizerCommentsJournal";
import { Button } from "@/components/ui/button";

export default function BookingOrganizerCommentsEditor({
  bookingId,
  comments,
  authorName,
  onUpdated,
}: {
  bookingId: string;
  comments: BookingOrganizerComment[];
  authorName: string;
  onUpdated?: () => void;
}) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

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

  return (
    <div className="space-y-4">
      <BookingOrganizerCommentsJournal comments={comments} title="Журнал комментариев" />

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
