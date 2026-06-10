"use client";

import { use } from "react";
import OrganizerShell from "@/components/organizer/OrganizerShell";
import OrganizerBookingDetailView from "@/components/organizer/OrganizerBookingDetailView";

export default function OrganizerBookingDetailPageClient({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <OrganizerShell>
      <OrganizerBookingDetailView bookingId={id} />
    </OrganizerShell>
  );
}
