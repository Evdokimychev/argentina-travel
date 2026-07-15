import type { Metadata } from "next";
import BookingLookupView from "@/components/booking/BookingLookupView";

export const metadata: Metadata = {
  title: "Найти заявку",
};

export default function BookingFindPage() {
  return (
    <div className="min-h-[calc(100vh-var(--site-header-full-height,72px))] bg-pampas">
      <BookingLookupView />
    </div>
  );
}
