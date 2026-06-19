"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { evaluatePublishReadiness } from "@/lib/publish-readiness";
import type {
  OrganizerTourDraft,
  OrganizerTourEditorTabId,
} from "@/types/organizer-tour";

interface PublishChecklistModalProps {
  open: boolean;
  draft: OrganizerTourDraft;
  onOpenChange: (open: boolean) => void;
  onTabSelect: (tabId: OrganizerTourEditorTabId) => void;
  onPublishAnyway?: () => void;
  allowPublishDespiteWarnings?: boolean;
}

export default function PublishChecklistModal({
  open,
  draft,
  onOpenChange,
  onTabSelect,
  onPublishAnyway,
  allowPublishDespiteWarnings = false,
}: PublishChecklistModalProps) {
  const readiness = evaluatePublishReadiness(draft);
  const blocking = readiness.issues.filter((item) => item.severity === "blocking");
  const warnings = readiness.issues.filter((item) => item.severity === "warning");

  function handleGoToTab(tabId: OrganizerTourEditorTabId) {
    onTabSelect(tabId);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-xl" showClose>
        <DialogHeader>
          <DialogTitle>Чек-лист перед публикацией</DialogTitle>
          <DialogDescription>
            {readiness.ready
              ? "Обязательные поля заполнены. Проверьте рекомендации — они помогут улучшить карточку тура."
              : "Исправьте обязательные пункты — без них тур не появится в каталоге."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-5 py-4 sm:px-6">
          {blocking.length > 0 ? (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                Обязательно ({blocking.length})
              </h3>
              <ul className="mt-2 space-y-2">
                {blocking.map((issue) => (
                  <li
                    key={issue.id}
                    className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-sm text-charcoal"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    <span className="min-w-0 flex-1">
                      {issue.label}
                      {issue.tabId ? (
                        <>
                          {" "}
                          <button
                            type="button"
                            onClick={() => handleGoToTab(issue.tabId as OrganizerTourEditorTabId)}
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
            </section>
          ) : (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Все обязательные поля заполнены
            </div>
          )}

          {warnings.length > 0 ? (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate">
                Рекомендуем ({warnings.length})
              </h3>
              <ul className="mt-2 space-y-2">
                {warnings.map((issue) => (
                  <li
                    key={issue.id}
                    className="flex items-start gap-2 rounded-xl bg-gray-50 px-3 py-2.5 text-sm text-slate"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <span className="min-w-0 flex-1">
                      {issue.label}
                      {issue.tabId ? (
                        <>
                          {" "}
                          <button
                            type="button"
                            onClick={() => handleGoToTab(issue.tabId as OrganizerTourEditorTabId)}
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
            </section>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Закрыть
          </Button>
          {readiness.ready && onPublishAnyway ? (
            <Button type="button" onClick={onPublishAnyway}>
              {allowPublishDespiteWarnings && warnings.length > 0
                ? "Опубликовать с замечаниями"
                : "Опубликовать тур"}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
