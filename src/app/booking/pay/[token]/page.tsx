import type { Metadata } from "next";
import BookingPaymentLinkView from "@/components/booking/BookingPaymentLinkView";

export const metadata: Metadata = {
  title: "Оплата бронирования",
};

export default async function BookingPaymentLinkPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <div className="min-h-[calc(100vh-var(--site-header-full-height,72px))] bg-pampas">
      <BookingPaymentLinkView token={token} />
    </div>
  );
}
