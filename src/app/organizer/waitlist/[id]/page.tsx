import OrganizerWaitlistDetailPageClient from "./OrganizerWaitlistDetailPageClient";

export default async function OrganizerWaitlistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OrganizerWaitlistDetailPageClient waitlistId={id} />;
}
