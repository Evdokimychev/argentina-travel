"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import LegalPageView from "@/components/legal/LegalPageView";
import ContentPageView from "@/components/content/ContentPageView";
import { AdminPageShell } from "@/components/admin/AdminSidebar";
import CapabilityGate from "@/components/admin/CapabilityGate";
import {
  guidePageFromCms,
  legalDocumentFromCms,
  type CmsDocument,
} from "@/types/cms-content";
import { cabinetCardClass } from "@/lib/cabinet-ui";

type Props = {
  documentId: string;
};

type DocumentResponse = { document?: CmsDocument; error?: string };

export default function ContentDocumentPreviewView({ documentId }: Props) {
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

  const guidePreview = doc?.body.kind === "guide" ? guidePageFromCms(doc) : null;

  return (
    <CapabilityGate capability="content.edit">
      <AdminPageShell>
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm text-slate">
            Предпросмотр черновика · статус: {doc?.status ?? "…"}
          </p>
          <Link
            href={`/admin/content/documents/${encodedId}`}
            className="text-sm text-sky hover:underline"
          >
            ← Редактор
          </Link>
        </div>

        {loading ? <p className="text-sm text-slate">Загрузка…</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        {doc?.body.kind === "legal" ? (
          <LegalPageView document={legalDocumentFromCms(doc)!} />
        ) : null}

        {doc?.body.kind === "blog" ? (
          <article className={`${cabinetCardClass} mx-auto max-w-3xl space-y-6 p-6 sm:p-8`}>
            <header>
              <p className="text-xs uppercase tracking-wide text-sky">Статья · предпросмотр</p>
              <h1 className="mt-2 font-heading text-3xl font-bold text-charcoal">{doc.title}</h1>
              {doc.body.excerpt ? <p className="mt-3 text-slate">{doc.body.excerpt}</p> : null}
            </header>
            {(doc.body.sections ?? []).map((section, index) => (
              <section key={index}>
                <h2 className="font-heading text-xl font-bold text-charcoal">{section.title}</h2>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate">
                  {section.body}
                </p>
              </section>
            ))}
            {!doc.body.sections?.length && doc.body.content ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate">{doc.body.content}</p>
            ) : null}
          </article>
        ) : null}

        {guidePreview ? <ContentPageView page={guidePreview} /> : null}

        {doc && doc.body.kind !== "legal" && doc.body.kind !== "blog" && doc.body.kind !== "guide" ? (
          <p className="text-sm text-slate">Тип документа не поддерживается для предпросмотра.</p>
        ) : null}
      </AdminPageShell>
    </CapabilityGate>
  );
}
