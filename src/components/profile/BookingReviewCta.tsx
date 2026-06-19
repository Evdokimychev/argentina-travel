import Link from "next/link";
import { buildReviewHref, bookingNeedsReview } from "@/lib/tourist-review-cta";
import type { Booking } from "@/types/tourist";

export default function BookingReviewCta({
  booking,
  userId,
  className,
}: {
  booking: Booking;
  userId: string;
  className?: string;
}) {
  if (!bookingNeedsReview(booking, userId)) return null;

  return (
    <Link
      href={buildReviewHref(booking)}
      className={
        className ??
        "inline-flex items-center rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand/90"
      }
    >
      Оставить отзыв
    </Link>
  );
}
