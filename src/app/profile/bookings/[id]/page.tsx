"use client";

import BookingTouristDetailView from "@/components/booking/BookingTouristDetailView";
import { use } from "react";

export default function ProfileBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <BookingTouristDetailView bookingId={id} />;
}
