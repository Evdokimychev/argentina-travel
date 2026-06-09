import type { Metadata } from "next";
import { ORGANIZER_TOUR_LISTINGS } from "@/data/organizer-tours";
import OrganizerTourEditorPageClient from "./OrganizerTourEditorPageClient";

export const metadata: Metadata = {
  title: "Редактирование тура — кабинет организатора",
};

export function generateStaticParams() {
  return ORGANIZER_TOUR_LISTINGS.map((tour) => ({ id: tour.id }));
}

export default function OrganizerTourEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <OrganizerTourEditorPageClient params={params} />;
}
