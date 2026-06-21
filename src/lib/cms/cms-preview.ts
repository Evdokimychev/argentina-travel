import type { CmsDocument, CmsDocumentBody, CmsDocumentSeo } from "@/types/cms-content";

const CMS_PREVIEW_DRAFT_PREFIX = "argentina-travel-cms-preview:";

export type CmsPreviewDraft = {
  title: string;
  body: CmsDocumentBody;
  seo: CmsDocumentSeo;
};

export function cmsPreviewDraftKey(documentId: string): string {
  return `${CMS_PREVIEW_DRAFT_PREFIX}${documentId}`;
}

export function stageCmsDocumentPreviewDraft(documentId: string, draft: CmsPreviewDraft): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(cmsPreviewDraftKey(documentId), JSON.stringify(draft));
}

export function readStagedCmsDocumentPreviewDraft(documentId: string): CmsPreviewDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(cmsPreviewDraftKey(documentId));
    if (!raw) return null;
    return JSON.parse(raw) as CmsPreviewDraft;
  } catch {
    return null;
  }
}

export function clearStagedCmsDocumentPreviewDraft(documentId: string): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(cmsPreviewDraftKey(documentId));
}

/** Merge unsaved editor draft over the saved CMS document for live preview. */
export function mergeCmsDocumentWithPreviewDraft(
  document: CmsDocument,
  draft: CmsPreviewDraft | null
): CmsDocument {
  if (!draft) return document;
  return {
    ...document,
    title: draft.title.trim() || document.title,
    body: draft.body,
    seo: draft.seo,
  };
}
