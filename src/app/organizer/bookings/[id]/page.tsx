import type { Metadata } from "next";
import OrganizerBookingDetailPageClient from "./OrganizerBookingDetailPageClient";

export const metadata: Metadata = { title: "Заявка — кабинет организатора" };

export default function OrganizerBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <OrganizerBookingDetailPageClient params={params} />;
}
