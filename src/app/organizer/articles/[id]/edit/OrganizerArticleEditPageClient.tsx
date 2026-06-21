"use client";

import OrganizerShell from "@/components/organizer/OrganizerShell";
import OrganizerArticleEditorView from "@/components/organizer/OrganizerArticleEditorView";

type Props = {
  documentId: string;
};

export default function OrganizerArticleEditPageClient({ documentId }: Props) {
  return (
    <OrganizerShell>
      <OrganizerArticleEditorView documentId={documentId} />
    </OrganizerShell>
  );
}
