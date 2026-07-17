import type { Metadata } from "next";
import ApartmentManagerView from "@/components/apartments/ApartmentManagerView";
import OrganizerShell from "@/components/organizer/OrganizerShell";
import { privatePageMetadata } from "@/lib/private-page-metadata";

export const metadata: Metadata = privatePageMetadata("Апартаменты — кабинет организатора", "Объекты, условия, календарь и отправка на модерацию.");
export default function OrganizerApartmentsPage() { return <OrganizerShell><ApartmentManagerView role="organizer" /></OrganizerShell>; }
