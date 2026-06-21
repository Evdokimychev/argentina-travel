import { Suspense } from "react";
import OrganizerArticlePreviewView from "@/components/organizer/OrganizerArticlePreviewView";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrganizerArticlePreviewPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <Suspense fallback={<p className="p-6 text-sm text-slate">Загрузка предпросмотра…</p>}>
      <OrganizerArticlePreviewView documentId={decodeURIComponent(id)} />
    </Suspense>
  );
}
