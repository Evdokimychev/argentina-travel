import type { Metadata } from "next";
import { Suspense } from "react";
import BookingLookupView from "@/components/booking/BookingLookupView";

export const metadata: Metadata = {
  title: "Найти заявку — Пора в Аргентину",
};

export default function BookingFindPage() {
  return (
    <div className="min-h-[calc(100vh-var(--site-header-full-height,72px))] bg-pampas">
      <Suspense fallback={<div className="px-4 py-16 text-center text-sm text-slate">Загрузка…</div>}>
        <BookingLookupView />
      </Suspense>
    </div>
  );
}
