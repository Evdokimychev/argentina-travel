import ContentDocumentPreviewView from "@/components/admin/views/ContentDocumentPreviewView";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminContentDocumentPreviewPage({ params }: PageProps) {
  const { id } = await params;
  return <ContentDocumentPreviewView documentId={decodeURIComponent(id)} />;
}
