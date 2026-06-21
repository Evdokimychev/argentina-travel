import OrganizerArticleEditPageClient from "./OrganizerArticleEditPageClient";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrganizerArticleEditPage({ params }: PageProps) {
  const { id } = await params;
  return <OrganizerArticleEditPageClient documentId={decodeURIComponent(id)} />;
}
