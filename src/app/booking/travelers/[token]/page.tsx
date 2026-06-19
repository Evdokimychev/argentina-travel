import type { Metadata } from "next";
import BookingTravelersFormView from "@/components/booking/BookingTravelersFormView";

export const metadata: Metadata = {
  title: "Данные туристов",
};

export default async function BookingTravelersFormPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <div className="min-h-[calc(100vh-var(--site-header-full-height,72px))] bg-pampas">
      <BookingTravelersFormView token={token} />
    </div>
  );
}
