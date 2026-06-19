"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import TripPrepHub from "@/components/trip-prep/TripPrepHub";
import TripPrepBookingPicker from "@/components/trip-prep/TripPrepBookingPicker";

function TripPrepPageContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId")?.trim() || undefined;

  return (
    <div className="space-y-6">
      <section>
        <h1 className="font-display text-2xl font-bold text-charcoal sm:text-3xl">
          Подготовка к поездке
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate">
          Персональный чек-лист перед вылетом: документы, связь, деньги, здоровье и контакты организатора.
          Прогресс сохраняется в вашем аккаунте.
        </p>
      </section>

      {!bookingId ? <TripPrepBookingPicker /> : null}
      <TripPrepHub bookingId={bookingId} />
    </div>
  );
}

export default function ProfileTripPrepPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate">Загрузка…</p>}>
      <TripPrepPageContent />
    </Suspense>
  );
}
