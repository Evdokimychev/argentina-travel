"use client";

import { Clock, Eye } from "lucide-react";
import { formatScheduledPublishLabel } from "@/lib/cms/cms-scheduled-publish";
import type { CmsDocument } from "@/types/cms-content";

type Props = {
  doc: CmsDocument;
  liveDraft?: boolean;
};

export default function CmsPreviewBanner({ doc, liveDraft = false }: Props) {
  const scheduledLabel =
    doc.status === "scheduled" && doc.scheduledPublishAt
      ? formatScheduledPublishLabel(doc.scheduledPublishAt)
      : null;

  return (
    <div className="sticky top-0 z-40 border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 shadow-sm">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-1">
        <span className="inline-flex items-center gap-1.5 font-medium">
          <Eye className="h-4 w-4 shrink-0" aria-hidden />
          Предпросмотр CMS
          {liveDraft ? " · несохранённые правки" : " · сохранённая версия"}
        </span>
        <span className="text-amber-800">
          Статус: <strong>{doc.status}</strong>
          {scheduledLabel ? (
            <>
              {" "}
              · запланировано на <strong>{scheduledLabel}</strong>
            </>
          ) : null}
        </span>
        {scheduledLabel ? (
          <span className="inline-flex items-center gap-1 text-xs text-amber-700">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            На сайте материал появится после публикации
          </span>
        ) : (
          <span className="text-xs text-amber-700">Материал не виден посетителям, пока не опубликован</span>
        )}
      </div>
    </div>
  );
}
