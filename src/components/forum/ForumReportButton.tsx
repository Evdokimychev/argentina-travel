"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { isSupabaseForumEnabled } from "@/lib/auth-mode";
import { cn } from "@/lib/cn";
import { FORUM_REPORT_REASON_LABELS, type ForumReportReason } from "@/lib/forum/forum-types";
import InlineFeedback from "@/components/feedback/InlineFeedback";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { NativeSelect } from "@/components/ui/native-select";
import { SmartTextarea } from "@/components/ui/smart-textarea";

const REPORT_OPTIONS: Array<{ value: ForumReportReason; label: string }> = [
  { value: "spam", label: "Спам или реклама" },
  { value: "offensive", label: "Оскорбления" },
  { value: "fake", label: "Подозрительная информация" },
  { value: "irrelevant", label: "Не по теме" },
  { value: "other", label: "Другое" },
];

type ForumReportButtonProps = {
  postId: string;
  className?: string;
};

export default function ForumReportButton({ postId, className }: ForumReportButtonProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ForumReportReason>("spam");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isSupabaseForumEnabled()) return null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/forum/posts/${postId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, details }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Не удалось отправить жалобу");
      setMessage("Жалоба отправлена модераторам. Спасибо.");
      setOpen(false);
      setDetails("");
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Не удалось отправить жалобу"
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) return null;

  return (
    <div className={cn(className)}>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        aria-haspopup="dialog"
        className="-my-2 inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-xs text-slate transition-colors hover:bg-surface-muted hover:text-sky focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/35"
      >
        <Flag className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
        Пожаловаться
      </button>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) setError(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <form onSubmit={(event) => void handleSubmit(event)} className="flex min-h-0 flex-1 flex-col">
            <DialogHeader className="pr-16">
              <DialogTitle>Жалоба на сообщение</DialogTitle>
              <DialogDescription>
                Выберите причину. Модератор проверит сообщение и примет решение.
              </DialogDescription>
            </DialogHeader>
            <DialogBody className="space-y-4">
              <FormField id={`forum-report-reason-${postId}`} label="Причина" required>
                <NativeSelect
                  id={`forum-report-reason-${postId}`}
                  value={reason}
                  onChange={(event) => setReason(event.target.value as ForumReportReason)}
                  required
                >
                  {REPORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {FORUM_REPORT_REASON_LABELS[option.value]}
                    </option>
                  ))}
                </NativeSelect>
              </FormField>
              <SmartTextarea
                id={`forum-report-details-${postId}`}
                label="Комментарий"
                value={details}
                onValueChange={setDetails}
                rows={4}
                optional
                hint="Добавьте детали, которые помогут модератору быстрее разобраться."
                placeholder="Что именно нарушает правила?"
              />
              {error ? (
                <InlineFeedback
                  variant="error"
                  title="Не удалось отправить жалобу"
                  description={error}
                />
              ) : null}
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Отмена
              </Button>
              <Button type="submit" loading={submitting} loadingLabel="Отправляем…">
                Отправить жалобу
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {message ? (
        <InlineFeedback variant="success" title={message} className="mt-2" />
      ) : null}
    </div>
  );
}
