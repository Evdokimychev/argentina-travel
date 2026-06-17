import type { Metadata } from "next";
import TripClientPortalView from "@/components/trip/TripClientPortalView";

export const metadata: Metadata = {
  title: "Ваша поездка — Пора в Аргентину",
  robots: { index: false, follow: false },
};

export default async function TripClientPortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <div className="min-h-[calc(100vh-var(--site-header-height,72px))] bg-pampas">
      <TripClientPortalView token={token} />
    </div>
  );
}
