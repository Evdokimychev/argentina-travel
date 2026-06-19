import type { Metadata } from "next";
import BookingPaymentResultView from "@/components/booking/BookingPaymentResultView";

export const metadata: Metadata = {
  title: "Результат оплаты",
};

export default async function BookingPaymentResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { token } = await params;
  const { status = "pending" } = await searchParams;

  return (
    <div className="min-h-[calc(100vh-var(--site-header-full-height,72px))] bg-pampas">
      <BookingPaymentResultView token={token} status={status} />
    </div>
  );
}
