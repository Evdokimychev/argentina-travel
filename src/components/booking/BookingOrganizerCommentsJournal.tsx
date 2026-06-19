import type { BookingOrganizerComment } from "@/types/tourist";
import { formatBookingDateTime } from "@/lib/booking-datetime";

export default function BookingOrganizerCommentsJournal({
  comments,
  title = "Сообщения организатора",
}: {
  comments: BookingOrganizerComment[];
  title?: string;
}) {
  if (comments.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-slate">
        Организатор пока не оставлял комментариев к этой заявке.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-heading text-base font-bold text-charcoal">{title}</h3>
      <ul className="space-y-3">
        {comments.map((comment) => {
          const { date, time } = formatBookingDateTime(comment.createdAt);
          return (
            <li
              key={comment.id}
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm"
            >
              <p className="text-sm leading-relaxed text-charcoal">{comment.text}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate">
                <span className="font-medium text-charcoal">{comment.authorName}</span>
                <span>
                  {date}
                  {time ? ` · ${time}` : ""}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
