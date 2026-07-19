"use client";

import { useState } from "react";
import { Check, ExternalLink, FilePlus2, RefreshCw, X } from "lucide-react";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminSidebar";
import CapabilityGate from "@/components/admin/CapabilityGate";
import IngestionTabs from "@/components/admin/ingestion/IngestionTabs";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { useAdminApi } from "@/hooks/useAdminApi";
import { cabinetCardClass } from "@/lib/cabinet-ui";

type Duplicate = {
  relation_type: string;
  similarity: number;
  resolution: string;
  related: { title: string; summary: string; processed_content: string; quality_score: number } | null;
};

type Candidate = {
  id: string;
  status: string;
  title: string;
  summary: string;
  processed_content: string;
  category: string | null;
  province: string | null;
  city: string | null;
  quality_score: number;
  freshness_score: number;
  trust_score: number;
  flags: string[];
  decision_reasons: string[];
  suggested_target: string;
  cms_document_id: string | null;
  related_cms_document_id: string | null;
  related_content_score: number | null;
  ingestion_sources?: { name: string; source_type: string } | null;
  duplicates?: Duplicate[];
};

export default function IngestionModerationView() {
  const [status, setStatus] = useState("awaiting_moderation");
  const { data, loading, error, refresh } = useAdminApi<{ candidates: Candidate[] }>(
    `/api/admin/ingestion/candidates?status=${status}`,
  );
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [content, setContent] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  function choose(candidate: Candidate) {
    setSelected(candidate);
    setContent(candidate.processed_content);
    setNotes("");
    setActionError(null);
  }

  async function act(action: string) {
    if (!selected) return;
    setBusy(true);
    setActionError(null);
    try {
      const response = await fetch(`/api/admin/ingestion/candidates/${selected.id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, content, notes }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Действие не выполнено");
      setSelected(null);
      await refresh();
    } catch (actionFailure) {
      setActionError(actionFailure instanceof Error ? actionFailure.message : "Действие не выполнено");
    } finally {
      setBusy(false);
    }
  }

  const duplicate = selected?.duplicates?.[0];

  return (
    <CapabilityGate capability="moderation.view">
      <AdminPageShell>
        <AdminPageHeader
          title="Разбор материалов"
          subtitle="Редакторская проверка перед созданием черновика"
          actions={
            <div className="flex gap-2">
              <NativeSelect
                aria-label="Состояние"
                value={status}
                onChange={(event) => { setSelected(null); setStatus(event.target.value); }}
              >
                <option value="awaiting_moderation">Ждут проверки</option>
                <option value="approved">Одобрены</option>
                <option value="rejected">Отклонены</option>
                <option value="duplicate">Повторы</option>
                <option value="published">Переданы в CMS</option>
                <option value="all">Все</option>
              </NativeSelect>
              <Button variant="outline" size="icon" title="Обновить" onClick={() => void refresh()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          }
        />
        <IngestionTabs />
        {error ? <p className="text-sm text-red-700">{error}</p> : null}

        <div className="grid min-h-[520px] gap-5 lg:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.4fr)]">
          <section className={`${cabinetCardClass} overflow-hidden`}>
            <ul className="divide-y divide-border-subtle">
              {(data?.candidates ?? []).map((candidate) => (
                <li key={candidate.id}>
                  <button
                    type="button"
                    onClick={() => choose(candidate)}
                    className={`w-full p-4 text-left hover:bg-surface-muted ${selected?.id === candidate.id ? "bg-sky/5" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="font-medium text-foreground">{candidate.title}</h2>
                      <span className="shrink-0 text-sm font-bold text-sky">{candidate.quality_score}</span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted">{candidate.summary}</p>
                    <p className="mt-2 text-xs text-muted">
                      {candidate.ingestion_sources?.name ?? "Источник"} · {candidate.category ?? "без рубрики"}
                    </p>
                  </button>
                </li>
              ))}
              {!loading && !(data?.candidates.length) ? <li className="p-8 text-center text-sm text-muted">Очередь пуста</li> : null}
            </ul>
          </section>

          <section className={`${cabinetCardClass} p-5`}>
            {selected ? (
              <div className="space-y-5">
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h2 className="text-lg font-semibold">{selected.title}</h2>
                    <div className="flex gap-2 text-xs">
                      <span className="rounded bg-emerald-50 px-2 py-1 text-emerald-800">доверие {selected.trust_score}</span>
                      <span className="rounded bg-sky/10 px-2 py-1 text-sky">качество {selected.quality_score}</span>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-muted">
                    {[selected.province, selected.city, selected.category].filter(Boolean).join(" · ") || "География не определена"}
                  </p>
                  {selected.related_cms_document_id ? <a href={`/admin/content/documents/${selected.related_cms_document_id}`} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-sky">Связанная страница · сходство {Math.round((selected.related_content_score ?? 0) * 100)}%<ExternalLink className="h-3.5 w-3.5" /></a> : null}
                </div>

                {duplicate?.related ? (
                  <div className="grid gap-3 border-y border-border-subtle py-4 md:grid-cols-2">
                    <div><p className="text-xs font-semibold uppercase text-muted">Новый материал</p><p className="mt-2 text-sm font-medium">{selected.title}</p><p className="mt-2 line-clamp-5 text-xs leading-5 text-muted">{selected.processed_content}</p></div>
                    <div><p className="text-xs font-semibold uppercase text-muted">Уже сохранён</p><p className="mt-2 text-sm font-medium">{duplicate.related.title}</p><p className="mt-2 line-clamp-5 text-xs leading-5 text-muted">{duplicate.related.processed_content}</p></div>
                    <p className="text-xs text-muted md:col-span-2">Сходство {Math.round(duplicate.similarity * 100)}% · {duplicate.relation_type}</p>
                  </div>
                ) : null}

                <Textarea value={content} onChange={(event) => setContent(event.target.value)} className="min-h-72" aria-label="Текст материала" />
                <label className="block space-y-1 text-sm font-medium">Комментарий редактора<Textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="min-h-20" /></label>
                {selected.flags.length ? <p className="text-xs text-amber-800">Проверить: {selected.flags.join(", ")}</p> : null}
                {actionError ? <p role="alert" className="text-sm text-red-700">{actionError}</p> : null}

                <div className="flex flex-wrap gap-2">
                  {selected.status === "duplicate" ? (
                    <>
                      <Button disabled={busy} onClick={() => void act("duplicate_keep_primary")}>Оставить основной</Button>
                      <Button variant="outline" disabled={busy} onClick={() => void act("duplicate_keep_both")}>Оставить оба</Button>
                      <Button variant="outline" disabled={busy} onClick={() => void act("duplicate_as_update")}>Считать обновлением</Button>
                      <Button variant="ghost" disabled={busy} onClick={() => void act("duplicate_related")}>Связать</Button>
                    </>
                  ) : null}
                  {selected.status === "awaiting_moderation" ? (
                    <><Button disabled={busy} onClick={() => void act("approve")}><Check className="h-4 w-4" />Одобрить</Button><Button variant="outline" disabled={busy} onClick={() => void act("reject")}><X className="h-4 w-4" />Отклонить</Button></>
                  ) : null}
                  {selected.status === "approved" || selected.status === "awaiting_moderation" ? <Button variant="outline" disabled={busy} onClick={() => void act("publish")}><FilePlus2 className="h-4 w-4" />{selected.related_cms_document_id ? "Подготовить обновление" : "Создать черновик в CMS"}</Button> : null}
                  {selected.cms_document_id ? <a href={`/admin/content/documents/${selected.cms_document_id}`} className="inline-flex min-h-10 items-center gap-2 px-3 text-sm font-medium text-sky">Открыть в CMS<ExternalLink className="h-4 w-4" /></a> : null}
                </div>
              </div>
            ) : <div className="flex min-h-96 items-center justify-center text-sm text-muted">Выберите материал слева</div>}
          </section>
        </div>
      </AdminPageShell>
    </CapabilityGate>
  );
}
