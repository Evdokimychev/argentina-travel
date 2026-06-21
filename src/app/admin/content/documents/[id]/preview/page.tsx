import { Suspense } from "react";
import ContentDocumentPreviewView from "@/components/admin/views/ContentDocumentPreviewView";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminContentDocumentPreviewPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <Suspense fallback={<p className="p-6 text-sm text-slate">Загрузка предпросмотра…</p>}>
      <ContentDocumentPreviewView documentId={decodeURIComponent(id)} />
    </Suspense>
  );
}
