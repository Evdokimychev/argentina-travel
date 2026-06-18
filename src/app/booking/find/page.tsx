import type { Metadata } from "next";
import { Suspense } from "react";
import BookingLookupView from "@/components/booking/BookingLookupView";
import BookingLookupSkeleton from "@/components/booking/BookingLookupSkeleton";

export const metadata: Metadata = {
  title: "Найти заявку — Пора в Аргентину",
};

export default function BookingFindPage() {
  return (
    <div className="min-h-[calc(100vh-var(--site-header-full-height,72px))] bg-pampas">
      <Suspense fallback={<BookingLookupSkeleton />}>
        <BookingLookupView />
      </Suspense>
    </div>
  );
}
