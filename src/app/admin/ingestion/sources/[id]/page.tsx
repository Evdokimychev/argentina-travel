import IngestionSourceDetailView from "@/components/admin/ingestion/IngestionSourceDetailView";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <IngestionSourceDetailView sourceId={id} />;
}
