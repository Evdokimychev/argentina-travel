"use client";

import { useEffect, useMemo, useState } from "react";
import { History, MailCheck, Plus, RotateCcw } from "lucide-react";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminSidebar";
import CapabilityGate from "@/components/admin/CapabilityGate";
import InlineFeedback from "@/components/feedback/InlineFeedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { useAdminApi } from "@/hooks/useAdminApi";
import { cabinetCardClass } from "@/lib/cabinet-ui";
import type { EmailTemplateBlock, EmailTemplateCatalogEntry } from "@/lib/notifications/email-template-contract";

type VersionRow = {
  id: string;
  event_key: string;
  locale: string;
  version: number;
  status: "draft" | "active" | "archived";
  subject_template: string;
  body_blocks: EmailTemplateBlock[];
  row_version: number;
  activated_at: string | null;
  updated_at: string;
  source_version_id: string | null;
};

type CenterResponse = { catalog?: EmailTemplateCatalogEntry[]; versions?: VersionRow[] };
type Preview = { subject: string; html: string; text: string };

const LOCALE_LABELS = { ru: "Русский", en: "English", es: "Español", pt: "Português" } as const;

export default function AdminEmailTemplatesView() {
  const { data, loading, error, refresh } = useAdminApi<CenterResponse>("/api/admin/email-templates");
  const catalog = useMemo(() => data?.catalog ?? [], [data?.catalog]);
  const versions = useMemo(() => data?.versions ?? [], [data?.versions]);
  const [eventKey, setEventKey] = useState("booking.confirmed");
  const [locale, setLocale] = useState("ru");
  const [subject, setSubject] = useState("");
  const [blocks, setBlocks] = useState<EmailTemplateBlock[]>([]);
  const [selectedVariable, setSelectedVariable] = useState("");
  const [selectedParagraph, setSelectedParagraph] = useState(0);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ variant: "success" | "error"; message: string } | null>(null);

  const entry = catalog.find((item) => item.eventKey === eventKey) ?? null;
  const editable = entry?.connected === true;
  const relevant = versions.filter((item) => item.event_key === eventKey && item.locale === locale);
  const draft = relevant.find((item) => item.status === "draft") ?? null;
  const active = relevant.find((item) => item.status === "active") ?? null;
  const history = relevant.filter((item) => item.status === "archived");

  useEffect(() => {
    if (!entry) return;
    const source = draft ?? active;
    setSubject(source?.subject_template ?? entry.defaultSubject);
    setBlocks([...(source?.body_blocks ?? entry.defaultBlocks)]);
    setSelectedVariable(entry.variables[0]?.key ?? "");
    setSelectedParagraph(0);
    setPreview(null);
  }, [active, draft, entry, eventKey, locale]);

  async function mutate(body: Record<string, unknown>, success: string) {
    setBusy(String(body.action));
    setFeedback(null);
    try {
      const response = await fetch("/api/admin/email-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as { error?: string; preview?: Preview };
      if (!response.ok) throw new Error(payload.error ?? "Действие не выполнено");
      if (payload.preview) {
        setPreview(payload.preview);
      } else {
        setFeedback({ variant: "success", message: success });
        await refresh();
      }
    } catch (mutationError) {
      setFeedback({
        variant: "error",
        message: mutationError instanceof Error ? mutationError.message : "Попробуйте ещё раз",
      });
    } finally {
      setBusy(null);
    }
  }

  function editorPayload() {
    return { eventKey, locale, subjectTemplate: subject, bodyBlocks: blocks };
  }

  function updateBlock(index: number, patch: Partial<EmailTemplateBlock>) {
    setBlocks((current) => current.map((block, blockIndex) => blockIndex === index ? ({ ...block, ...patch } as EmailTemplateBlock) : block));
  }

  function removeBlock(index: number) {
    setBlocks((current) => current.filter((_, blockIndex) => blockIndex !== index));
  }

  function insertVariable(target: "subject" | "paragraph") {
    if (!selectedVariable) return;
    const token = `{{${selectedVariable}}}`;
    if (target === "subject") {
      setSubject((current) => `${current}${current.endsWith(" ") || !current ? "" : " "}${token}`);
      return;
    }
    const paragraphIndexes = blocks
      .map((block, index) => block.type === "paragraph" ? index : -1)
      .filter((index) => index >= 0);
    const targetIndex = paragraphIndexes[Math.min(selectedParagraph, paragraphIndexes.length - 1)];
    if (targetIndex === undefined) return;
    const block = blocks[targetIndex];
    if (block.type !== "paragraph") return;
    updateBlock(targetIndex, { text: `${block.text}${block.text.endsWith(" ") || !block.text ? "" : " "}${token}` });
  }

  return (
    <CapabilityGate capability="system.settings">
      <AdminPageShell>
        <AdminPageHeader
          title="Шаблоны писем"
          subtitle="Меняйте текст безопасно: код, скрипты и произвольная вёрстка здесь недоступны"
          actions={<Button variant="outline" onClick={() => void refresh()} disabled={loading}>Обновить</Button>}
        />

        {error ? <InlineFeedback variant="error" title="Шаблоны недоступны" description="Старые данные не показываются. Действующие встроенные письма продолжают работать." /> : null}
        {feedback ? <InlineFeedback variant={feedback.variant} title={feedback.variant === "success" ? "Готово" : "Не удалось"} description={feedback.message} /> : null}

        <section className={`${cabinetCardClass} grid gap-4 p-5 md:grid-cols-2`}>
          <label className="space-y-2 text-sm font-medium text-foreground">
            Событие
            <NativeSelect value={eventKey} onChange={(event) => setEventKey(event.target.value)}>
              {catalog.map((item) => <option key={item.eventKey} value={item.eventKey}>{item.label}</option>)}
            </NativeSelect>
          </label>
          <label className="space-y-2 text-sm font-medium text-foreground">
            Язык
            <NativeSelect value={locale} onChange={(event) => setLocale(event.target.value)}>
              {Object.entries(LOCALE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </NativeSelect>
          </label>
          <div className="md:col-span-2">
            <p className="text-sm text-slate">{entry?.description}</p>
            <p className="mt-2 text-xs font-medium text-foreground">
              {editable ? "Подключено: активная версия применяется к реальным письмам." : "Системный шаблон: его текст не управляется в этом разделе."}
            </p>
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.8fr)]">
          <section className={`${cabinetCardClass} space-y-5 p-5`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-heading text-lg font-bold text-charcoal">{draft ? `Черновик версии ${draft.version}` : "Новый черновик"}</h2>
                <p className="text-sm text-slate">Действующее письмо не меняется, пока вы не нажмёте «Активировать».</p>
              </div>
              {!draft && editable ? (
                <Button onClick={() => void mutate({ action: "create_draft", ...editorPayload(), expectedActiveId: active?.id ?? null }, "Черновик создан.")} disabled={busy !== null}>
                  <Plus className="h-4 w-4" /> Создать черновик
                </Button>
              ) : null}
            </div>

            <label className="block space-y-2 text-sm font-medium text-foreground">
              Тема письма
              <Input value={subject} maxLength={200} onChange={(event) => setSubject(event.target.value)} disabled={!draft || !editable} />
            </label>

            <div className="space-y-3">
              {blocks.map((block, index) => (
                <div key={`${block.type}-${index}`} className="rounded-xl border border-border-subtle bg-surface-muted/40 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-foreground">{block.type === "paragraph" ? "Текст" : block.type === "button" ? "Кнопка" : "Разделитель"}</p>
                    {draft && editable && blocks.length > 1 ? <Button variant="ghost" size="sm" onClick={() => removeBlock(index)}>Убрать</Button> : null}
                  </div>
                  {block.type === "paragraph" ? (
                    <Textarea value={block.text} maxLength={2000} rows={4} disabled={!draft || !editable} onFocus={() => setSelectedParagraph(blocks.slice(0, index + 1).filter((item) => item.type === "paragraph").length - 1)} onChange={(event) => updateBlock(index, { text: event.target.value })} />
                  ) : block.type === "button" ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input aria-label="Текст кнопки" value={block.label} maxLength={120} disabled={!draft || !editable} onChange={(event) => updateBlock(index, { label: event.target.value })} />
                      <NativeSelect aria-label="Ссылка кнопки" value={block.urlVariable} disabled={!draft || !editable} onChange={(event) => updateBlock(index, { urlVariable: event.target.value })}>
                        {entry?.variables.filter((variable) => variable.kind === "url").map((variable) => <option key={variable.key} value={variable.key}>{variable.label}</option>)}
                      </NativeSelect>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            {draft && editable ? (
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => setBlocks((current) => [...current, { type: "paragraph", text: "Новый текст" }])} disabled={blocks.length >= 12}>Добавить текст</Button>
                <Button variant="outline" onClick={() => setBlocks((current) => [...current, { type: "divider" }])} disabled={blocks.length >= 12}>Добавить разделитель</Button>
                {(entry?.variables.some((variable) => variable.kind === "url")) ? <Button variant="outline" onClick={() => setBlocks((current) => [...current, { type: "button", label: "Открыть", urlVariable: entry.variables.find((variable) => variable.kind === "url")!.key }])} disabled={blocks.length >= 12}>Добавить кнопку</Button> : null}
              </div>
            ) : null}

            <div className="rounded-xl border border-border-subtle p-4">
              <p className="text-sm font-semibold text-foreground">Переменные</p>
              <p className="mt-1 text-xs text-slate">При отправке они заменятся данными заявки. В предпросмотре используются вымышленные примеры.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <NativeSelect value={selectedVariable} onChange={(event) => setSelectedVariable(event.target.value)} disabled={!draft || !editable}>
                  {entry?.variables.map((variable) => <option key={variable.key} value={variable.key}>{variable.label}</option>)}
                </NativeSelect>
                <Button variant="outline" onClick={() => insertVariable("subject")} disabled={!draft || !editable}>В тему</Button>
                <Button variant="outline" onClick={() => insertVariable("paragraph")} disabled={!draft || !editable || !blocks.some((block) => block.type === "paragraph")}>В выбранный текст</Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {draft && editable ? <Button onClick={() => void mutate({ action: "update_draft", ...editorPayload(), templateId: draft.id, expectedVersion: draft.row_version }, "Черновик сохранён.")} disabled={busy !== null}>Сохранить черновик</Button> : null}
              <Button variant="outline" onClick={() => void mutate({ action: "preview", ...editorPayload() }, "")} disabled={busy !== null || !entry}>Предпросмотр</Button>
              {draft && editable ? <Button variant="outline" onClick={() => {
                if (!window.confirm("Активировать этот шаблон для всех новых писем выбранного типа и языка?")) return;
                void mutate({ action: "activate", eventKey, templateId: draft.id, expectedVersion: draft.row_version, expectedActiveId: active?.id ?? null }, "Новая версия активирована и применяется к новым письмам.");
              }} disabled={busy !== null}><MailCheck className="h-4 w-4" /> Активировать</Button> : null}
            </div>
            {draft && !entry?.connected ? <p className="text-xs text-slate">Этот системный шаблон доступен только для просмотра.</p> : null}
          </section>

          <div className="space-y-5">
            <section className={`${cabinetCardClass} overflow-hidden`}>
              <div className="border-b border-border-subtle p-4">
                <h2 className="font-heading text-lg font-bold text-charcoal">Предпросмотр</h2>
                <p className="text-sm text-slate">Письмо не отправляется и не использует данные клиентов.</p>
              </div>
              {preview ? (
                <div>
                  <p className="border-b border-border-subtle px-4 py-3 text-sm"><strong>Тема:</strong> {preview.subject}</p>
                  <iframe title="Предпросмотр письма" sandbox="" srcDoc={preview.html} className="h-[560px] w-full bg-white" />
                </div>
              ) : <p className="p-5 text-sm text-slate">Нажмите «Предпросмотр», чтобы проверить письмо.</p>}
            </section>

            <section className={`${cabinetCardClass} p-5`}>
              <div className="flex items-start gap-3">
                <History className="mt-0.5 h-5 w-5 text-sky" aria-hidden />
                <div>
                  <h2 className="font-heading text-lg font-bold text-charcoal">История версий</h2>
                  <p className="text-sm text-slate">История хранится полностью и не удаляется.</p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {active ? <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">Активна версия {active.version}</div> : <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Работает встроенный безопасный шаблон</div>}
                {history.length === 0 ? <p className="text-sm text-slate">Архивных версий пока нет.</p> : history.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-border-subtle p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">Версия {item.version}</p>
                      <p className="text-xs text-slate">Сохранена в истории</p>
                    </div>
                    <Button variant="outline" size="sm" disabled={busy !== null || !active || !editable} onClick={() => {
                      if (!active || !window.confirm(`Восстановить версию ${item.version} для всех новых писем этого типа?`)) return;
                      void mutate({ action: "rollback", eventKey, sourceTemplateId: item.id, expectedVersion: active.row_version }, `Версия ${item.version} восстановлена как новая активная версия.`);
                    }}>
                      <RotateCcw className="h-4 w-4" /> Восстановить
                    </Button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </AdminPageShell>
    </CapabilityGate>
  );
}
