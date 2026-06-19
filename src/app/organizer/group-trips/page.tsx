import type { Metadata } from "next";
import OrganizerGroupTripsPageClient from "./OrganizerGroupTripsPageClient";

export const metadata: Metadata = { title: "Наборы группы — кабинет организатора" };

export default function OrganizerGroupTripsPage() {
  return <OrganizerGroupTripsPageClient />;
}
