import ContentDocumentEditorView from "@/components/admin/views/ContentDocumentEditorView";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminContentDocumentEditPage({ params }: PageProps) {
  const { id } = await params;
  return <ContentDocumentEditorView documentId={decodeURIComponent(id)} />;
}
