"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";
import { evaluatePublishReadiness } from "@/lib/publish-readiness";
import type {
  OrganizerTourDraft,
  OrganizerTourEditorTabId,
} from "@/types/organizer-tour";
import { cn } from "@/lib/cn";

interface PublishReadinessPanelProps {
  draft: OrganizerTourDraft;
  compact?: boolean;
  onTabSelect?: (tabId: OrganizerTourEditorTabId) => void;
}

export default function PublishReadinessPanel({
  draft,
  compact = false,
  onTabSelect,
}: PublishReadinessPanelProps) {
  const readiness = evaluatePublishReadiness(draft);

  if (compact && readiness.ready && readiness.warningCount === 0) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        Готов к публикации
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl border bg-white",
        readiness.ready ? "border-emerald-200" : "border-amber-200"
      )}
    >
      <div
        className={cn(
          "px-4 py-3",
          readiness.ready ? "bg-emerald-50/80" : "bg-amber-50/80",
          compact ? "py-2.5" : "sm:px-5"
        )}
      >
        <p className="text-sm font-semibold text-charcoal">
          {readiness.ready ? "Тур готов к публикации" : "Публикация заблокирована"}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-slate">
          {readiness.ready
            ? readiness.warningCount > 0
              ? `Можно опубликовать. Рекомендуем исправить ${readiness.warningCount} замечаний для лучшей конверсии.`
              : "Все обязательные поля заполнены — тур появится в каталоге после сохранения."
            : "Исправьте обязательные пункты ниже. Без них тур не попадёт в каталог."}
        </p>
      </div>

      {readiness.issues.length > 0 ? (
        <ul className={cn("divide-y divide-gray-100", compact ? "px-3 py-2" : "px-4 py-3 sm:px-5")}>
          {readiness.issues.map((issue) => (
            <li key={issue.id} className="flex items-start gap-2 py-2 text-sm">
              {issue.severity === "blocking" ? (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              ) : (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-slate" />
              )}
              <span className={issue.severity === "blocking" ? "text-charcoal" : "text-slate"}>
                {issue.label}
                {issue.tabId && onTabSelect ? (
                  <>
                    {" "}
                    <button
                      type="button"
                      onClick={() => onTabSelect(issue.tabId as OrganizerTourEditorTabId)}
                      className="font-medium text-brand hover:underline"
                    >
                      Перейти
                    </button>
                  </>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
