import type { Metadata } from "next";
import { ORGANIZER_TOUR_LISTINGS } from "@/data/organizer-tours";
import OrganizerTourPreviewPageClient from "./OrganizerTourPreviewPageClient";

export const metadata: Metadata = {
  title: "Предпросмотр тура — кабинет организатора",
  robots: { index: false, follow: false },
};

export function generateStaticParams() {
  return ORGANIZER_TOUR_LISTINGS.map((tour) => ({ id: tour.id }));
}

export default function OrganizerTourPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <OrganizerTourPreviewPageClient params={params} />;
}
