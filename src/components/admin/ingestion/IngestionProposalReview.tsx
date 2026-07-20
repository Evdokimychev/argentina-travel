"use client";

import { useState } from "react";
import { Check, ExternalLink, Send, X } from "lucide-react";
import { IngestionProvenance, type IngestionProvenanceData } from "@/components/admin/ingestion/IngestionProvenance";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export type IngestionProposal = {
  id: string;
  candidate_id: string;
  content_document_id: string;
  base_version: number;
  proposed_title: string;
  proposed_body: unknown;
  diff: unknown;
  status: string;
  reviewed_at: string | null;
  applied_revision_id: string | null;
  created_at: string;
  candidate: {
    id: string;
    title: string;
    summary: string;
    quality_score: number;
    ingestion_sources?: { name: string; source_type: string } | null;
    provenance: IngestionProvenanceData | null;
  } | null;
  document: {
    id: string;
    title: string;
    status: string;
    row_version: number;
    updated_at: string;
  } | null;
};

type IngestionProposalReviewProps = {
  proposal: IngestionProposal;
  onCompleted: () => Promise<void>;
};

function bodyText(body: unknown): string {
  if (!body || typeof body !== "object" || Array.isArray(body)) return "";
  const value = body as Record<string, unknown>;
  if (typeof value.content === "string") return value.content;
  if (typeof value.description === "string") return value.description;
  if (typeof value.fullDescription === "string") return value.fullDescription;
  if (Array.isArray(value.sections)) {
    return value.sections.flatMap((section) => {
      if (!section || typeof section !== "object" || Array.isArray(section)) return [];
      const item = section as Record<string, unknown>;
      return [item.title, item.body].filter((part): part is string => typeof part === "string");
    }).join("\n\n");
  }
  return JSON.stringify(body, null, 2);
}

const statusLabel: Record<string, string> = {
  pending: "Ждёт решения",
  accepted: "Принято редактором",
  rejected: "Отклонено",
  applied: "Применено",
  superseded: "Устарело",
};

export function IngestionProposalReview({ proposal, onCompleted }: IngestionProposalReviewProps) {
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isStale = Boolean(
    proposal.document && proposal.document.row_version !== proposal.base_version,
  );
  const canApply = Boolean(
    proposal.document && proposal.document.row_version === proposal.base_version,
  );

  async function act(action: "accept" | "apply" | "reject") {
    setBusyAction(action);
    setError(null);
    try {
      const response = await fetch(`/api/admin/ingestion/proposals/${proposal.id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Решение не сохранено");
      await onCompleted();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Решение не сохранено");
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase text-muted">Предложение обновления</p>
            <h2 className="mt-1 text-lg font-semibold">{proposal.proposed_title}</h2>
          </div>
          <span className="rounded bg-sky/10 px-2 py-1 text-xs font-medium text-sky">
            {statusLabel[proposal.status] ?? proposal.status}
          </span>
        </div>
        <a
          href={`/admin/content/documents/${proposal.content_document_id}`}
          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-sky hover:underline"
        >
          {proposal.document?.title ?? proposal.content_document_id}
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
        <p className="mt-2 text-xs text-muted">
          Версия предложения: {proposal.base_version} · текущая версия CMS: {proposal.document?.row_version ?? "недоступна"}
        </p>
        {isStale ? (
          <p role="alert" className="mt-2 text-sm text-amber-800">
            Страница изменилась после подготовки предложения. Применение будет заблокировано, чтобы не потерять свежую редакцию.
          </p>
        ) : null}
        {!proposal.document ? (
          <p role="alert" className="mt-2 text-sm text-red-700">
            Связанная CMS-страница не найдена. Применение недоступно.
          </p>
        ) : null}
      </div>

      <IngestionProvenance provenance={proposal.candidate?.provenance ?? null} />

      <div>
        <p className="mb-2 text-sm font-medium">Предлагаемый текст</p>
        <Textarea readOnly value={bodyText(proposal.proposed_body)} className="min-h-72" />
      </div>

      {proposal.candidate ? (
        <p className="text-xs leading-5 text-muted">
          Основание: {proposal.candidate.title} · качество {proposal.candidate.quality_score} · {proposal.candidate.ingestion_sources?.name ?? "Источник"}
        </p>
      ) : null}
      {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        {proposal.status === "pending" ? (
          <Button loading={busyAction === "accept"} disabled={Boolean(busyAction)} onClick={() => void act("accept")}>
            <Check className="h-4 w-4" />Принять предложение
          </Button>
        ) : null}
        {proposal.status === "accepted" ? (
          <Button loading={busyAction === "apply"} disabled={Boolean(busyAction) || !canApply} onClick={() => void act("apply")}>
            <Send className="h-4 w-4" />Применить к CMS
          </Button>
        ) : null}
        {proposal.status === "pending" || proposal.status === "accepted" ? (
          <Button variant="outline" loading={busyAction === "reject"} disabled={Boolean(busyAction)} onClick={() => void act("reject")}>
            <X className="h-4 w-4" />Отклонить
          </Button>
        ) : null}
        {proposal.applied_revision_id ? (
          <span className="inline-flex min-h-10 items-center text-xs text-muted">
            Ревизия {proposal.applied_revision_id}
          </span>
        ) : null}
      </div>
    </div>
  );
}
