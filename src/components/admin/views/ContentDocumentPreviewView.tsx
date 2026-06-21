"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AdminPageShell } from "@/components/admin/AdminSidebar";
import CapabilityGate from "@/components/admin/CapabilityGate";
import CmsDocumentPreviewContent from "@/components/admin/cms/CmsDocumentPreviewContent";
import CmsPreviewBanner from "@/components/admin/cms/CmsPreviewBanner";
import {
  mergeCmsDocumentWithPreviewDraft,
  readStagedCmsDocumentPreviewDraft,
} from "@/lib/cms/cms-preview";
import type { CmsDocument } from "@/types/cms-content";

type Props = {
  documentId: string;
};

type DocumentResponse = { document?: CmsDocument; error?: string };

export default function ContentDocumentPreviewView({ documentId }: Props) {
  const searchParams = useSearchParams();
  const liveDraft = searchParams.get("live") === "1";
  const encodedId = encodeURIComponent(documentId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [doc, setDoc] = useState<CmsDocument | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/content/documents/${encodedId}`);
      const json = (await res.json()) as DocumentResponse;
      if (!res.ok || !json.document) throw new Error(json.error ?? "Документ не найден");
      setDoc(json.document);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }, [encodedId]);

  useEffect(() => {
    void load();
  }, [load]);

  const previewDoc = useMemo(() => {
    if (!doc) return null;
    if (!liveDraft) return doc;
    const staged = readStagedCmsDocumentPreviewDraft(documentId);
    return mergeCmsDocumentWithPreviewDraft(doc, staged);
  }, [doc, documentId, liveDraft]);

  return (
    <CapabilityGate capability="content.edit">
      <AdminPageShell>
        <div className="mb-4 flex items-center justify-between gap-3 px-4 pt-4 md:px-6">
          <p className="text-sm text-slate">
            {liveDraft ? "Предпросмотр с несохранёнными правками" : "Предпросмотр сохранённой версии"} ·{" "}
            {doc?.docType ?? "…"} · {doc?.slug ?? "…"}
          </p>
          <Link
            href={`/admin/content/documents/${encodedId}`}
            className="text-sm text-sky hover:underline"
          >
            ← Редактор
          </Link>
        </div>

        {loading ? <p className="px-4 text-sm text-slate md:px-6">Загрузка…</p> : null}
        {error ? <p className="px-4 text-sm text-red-600 md:px-6">{error}</p> : null}

        {previewDoc ? (
          <>
            <CmsPreviewBanner doc={previewDoc} liveDraft={liveDraft} />
            <CmsDocumentPreviewContent doc={previewDoc} />
          </>
        ) : null}
      </AdminPageShell>
    </CapabilityGate>
  );
}
