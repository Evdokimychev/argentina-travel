"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { cabinetCardClass } from "@/lib/cabinet-ui";
import {
  cmsPublicationGateMessage,
  type CmsPublicationGateResult,
} from "@/lib/cms/publication-gate";
import type { CmsDocument, CmsRiskLevel, CmsWorkflowStage } from "@/types/cms-content";

type GovernanceSource = {
  source_id: string;
  purpose: string;
  is_primary: boolean;
  source: {
    id: string;
    title: string;
    authority: string;
    url: string;
    trust_level: string;
    status: string;
    checked_at: string;
  } | null;
};

type GovernanceClaim = {
  id: string;
  statement: string;
  topic: string;
  source_id: string;
  risk_level: string;
  status: string;
  last_verified_at: string;
  next_review_at: string;
};

type GovernanceResponse = {
  gate: CmsPublicationGateResult;
  sources: GovernanceSource[];
  claims: GovernanceClaim[];
  media: Array<{
    media_asset_id: string;
    role: string;
    asset: { rights_status?: string; alt?: string | null } | null;
  }>;
  widgets: Array<{ widget_id: string; status: string }>;
  reviewers: Array<{ id: string; label: string }>;
  error?: string;
};

const WORKFLOW_STAGES: Array<{ value: CmsWorkflowStage; label: string }> = [
  { value: "draft", label: "Черновик" },
  { value: "research", label: "Сбор фактов" },
  { value: "fact_check", label: "Фактчек" },
  { value: "editorial_review", label: "Редакторская проверка" },
  { value: "legal_review", label: "Юридическая проверка" },
  { value: "media_review", label: "Проверка медиа" },
  { value: "ready", label: "Готово к публикации" },
  { value: "stale", label: "Требует обновления" },
  { value: "archived", label: "Архив" },
];

const RISK_LEVELS: Array<{ value: CmsRiskLevel; label: string }> = [
  { value: "low", label: "Низкий" },
  { value: "medium", label: "Средний" },
  { value: "high", label: "Высокий" },
  { value: "critical", label: "Критический" },
];

function dateInputValue(value: string | null | undefined): string {
  return value?.slice(0, 10) ?? "";
}

function dateToIso(value: string): string | null {
  return value ? new Date(`${value}T12:00:00.000Z`).toISOString() : null;
}

export default function CmsGovernancePanel({ document }: { document: CmsDocument }) {
  const endpoint = `/api/admin/content/documents/${encodeURIComponent(document.id)}/governance`;
  const [data, setData] = useState<GovernanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [workflowStage, setWorkflowStage] = useState<CmsWorkflowStage>(
    document.workflowStage ?? "draft"
  );
  const [riskLevel, setRiskLevel] = useState<CmsRiskLevel>(document.riskLevel ?? "low");
  const [reviewerId, setReviewerId] = useState(document.reviewerId ?? "");
  const [factCheckedAt, setFactCheckedAt] = useState(dateInputValue(document.lastFactCheckedAt));
  const [nextReviewAt, setNextReviewAt] = useState(dateInputValue(document.nextReviewAt));

  const [sourceTitle, setSourceTitle] = useState("");
  const [sourceAuthority, setSourceAuthority] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourcePrimary, setSourcePrimary] = useState(true);

  const [claimStatement, setClaimStatement] = useState("");
  const [claimTopic, setClaimTopic] = useState("");
  const [claimSourceId, setClaimSourceId] = useState("");
  const [claimRisk, setClaimRisk] = useState<CmsRiskLevel>("medium");
  const [claimVerifiedAt, setClaimVerifiedAt] = useState(dateInputValue(new Date().toISOString()));
  const [claimReviewAt, setClaimReviewAt] = useState("");

  useEffect(() => {
    setWorkflowStage(document.workflowStage ?? "draft");
    setRiskLevel(document.riskLevel ?? "low");
    setReviewerId(document.reviewerId ?? "");
    setFactCheckedAt(dateInputValue(document.lastFactCheckedAt));
    setNextReviewAt(dateInputValue(document.nextReviewAt));
  }, [document]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(endpoint);
      const json = (await response.json()) as GovernanceResponse;
      if (!response.ok) throw new Error(json.error ?? "Не удалось загрузить редакционные данные");
      setData(json);
      if (!claimSourceId && json.sources[0]?.source_id) {
        setClaimSourceId(json.sources[0].source_id);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, [claimSourceId, endpoint]);

  useEffect(() => {
    void load();
  }, [load]);

  async function mutate(method: "POST" | "DELETE", body?: object, query = "") {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`${endpoint}${query}`, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = (await response.json()) as GovernanceResponse;
      if (!response.ok) throw new Error(json.error ?? "Операция не выполнена");
      if (method === "POST") setData(json);
      else await load();
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : "Ошибка");
    } finally {
      setSaving(false);
    }
  }

  async function saveMetadata() {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/content/documents/${encodeURIComponent(document.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workflowStage,
            riskLevel,
            reviewerId: reviewerId || null,
            lastFactCheckedAt: dateToIso(factCheckedAt),
            nextReviewAt: dateToIso(nextReviewAt),
          }),
        }
      );
      const json = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(json.error ?? "Не удалось сохранить этап проверки");
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  }

  const invalidMediaCount = useMemo(
    () => data?.media.filter((item) => item.asset?.rights_status !== "verified").length ?? 0,
    [data]
  );

  return (
    <section className={`${cabinetCardClass} space-y-4 p-4 text-sm`}>
      <div>
        <h2 className="font-heading text-sm font-bold text-charcoal">Редакционная проверка</h2>
        <p className="mt-1 text-xs leading-relaxed text-slate">
          Источники, проверяемые утверждения и права на медиа участвуют в блокировке публикации.
        </p>
      </div>

      {loading ? <p className="text-xs text-slate">Проверяем готовность…</p> : null}
      {error ? <p className="rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</p> : null}

      {data ? (
        <div
          className={`rounded-xl border p-3 text-xs ${
            data.gate.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-amber-200 bg-amber-50 text-amber-900"
          }`}
        >
          <p className="font-semibold">
            {data.gate.ok ? "Можно публиковать" : "Публикация заблокирована"}
          </p>
          {!data.gate.ok ? <p className="mt-1">{cmsPublicationGateMessage(data.gate)}</p> : null}
          <p className="mt-2 opacity-80">
            Источники: {data.gate.sourceCount} · claims: {data.gate.claimCount} · проблемы медиа:{" "}
            {data.gate.invalidMediaCount}
          </p>
        </div>
      ) : null}

      <div className="space-y-3 rounded-xl border border-gray-100 p-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-xs text-slate">
            <span>Этап</span>
            <NativeSelect
              value={workflowStage}
              onChange={(event) => setWorkflowStage(event.target.value as CmsWorkflowStage)}
            >
              {WORKFLOW_STAGES.map((stage) => (
                <option key={stage.value} value={stage.value}>
                  {stage.label}
                </option>
              ))}
            </NativeSelect>
          </label>
          <label className="space-y-1 text-xs text-slate">
            <span>Риск</span>
            <NativeSelect
              value={riskLevel}
              onChange={(event) => setRiskLevel(event.target.value as CmsRiskLevel)}
            >
              {RISK_LEVELS.map((risk) => (
                <option key={risk.value} value={risk.value}>
                  {risk.label}
                </option>
              ))}
            </NativeSelect>
          </label>
        </div>
        <label className="block space-y-1 text-xs text-slate">
          <span>Проверяющий</span>
          <NativeSelect value={reviewerId} onChange={(event) => setReviewerId(event.target.value)}>
            <option value="">Не назначен</option>
            {data?.reviewers.map((reviewer) => (
              <option key={reviewer.id} value={reviewer.id}>
                {reviewer.label}
              </option>
            ))}
          </NativeSelect>
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-xs text-slate">
            <span>Факты проверены</span>
            <Input type="date" value={factCheckedAt} onChange={(event) => setFactCheckedAt(event.target.value)} />
          </label>
          <label className="space-y-1 text-xs text-slate">
            <span>Следующая проверка</span>
            <Input type="date" value={nextReviewAt} onChange={(event) => setNextReviewAt(event.target.value)} />
          </label>
        </div>
        <Button size="sm" variant="outline" className="w-full" disabled={saving} onClick={() => void saveMetadata()}>
          Сохранить проверку
        </Button>
      </div>

      <details className="rounded-xl border border-gray-100 p-3" open={data?.sources.length === 0}>
        <summary className="cursor-pointer font-medium text-charcoal">
          Источники · {data?.sources.length ?? 0}
        </summary>
        <ul className="mt-3 space-y-2">
          {data?.sources.map((item) => (
            <li key={item.source_id} className="rounded-lg bg-gray-50 p-2 text-xs">
              <a href={item.source?.url} target="_blank" rel="noreferrer" className="font-medium text-sky hover:underline">
                {item.source?.title ?? item.source_id}
              </a>
              <p className="mt-1 text-slate">
                {item.source?.authority} · {item.source?.trust_level} · {item.is_primary ? "основной" : item.purpose}
              </p>
              <button
                type="button"
                className="mt-1 text-red-600 hover:underline"
                disabled={saving}
                onClick={() => void mutate("DELETE", undefined, `?kind=source&itemId=${encodeURIComponent(item.source_id)}`)}
              >
                Отвязать
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-3 space-y-2">
          <Input placeholder="Название источника" value={sourceTitle} onChange={(event) => setSourceTitle(event.target.value)} />
          <Input placeholder="Организация / authority" value={sourceAuthority} onChange={(event) => setSourceAuthority(event.target.value)} />
          <Input type="url" placeholder="https://…" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} />
          <label className="flex items-center gap-2 text-xs text-slate">
            <input type="checkbox" checked={sourcePrimary} onChange={(event) => setSourcePrimary(event.target.checked)} />
            Основной источник
          </label>
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            disabled={saving || !sourceTitle.trim() || !sourceAuthority.trim() || !sourceUrl.startsWith("https://")}
            onClick={() => {
              void mutate("POST", {
                action: "add_source",
                title: sourceTitle,
                authority: sourceAuthority,
                url: sourceUrl,
                isPrimary: sourcePrimary,
              }).then(() => {
                setSourceTitle("");
                setSourceAuthority("");
                setSourceUrl("");
              });
            }}
          >
            Добавить источник
          </Button>
        </div>
      </details>

      <details className="rounded-xl border border-gray-100 p-3" open={data?.claims.length === 0}>
        <summary className="cursor-pointer font-medium text-charcoal">
          Проверяемые утверждения · {data?.claims.length ?? 0}
        </summary>
        <ul className="mt-3 space-y-2">
          {data?.claims.map((claim) => (
            <li key={claim.id} className="rounded-lg bg-gray-50 p-2 text-xs">
              <p className="font-medium text-charcoal">{claim.statement}</p>
              <p className="mt-1 text-slate">
                {claim.topic} · {claim.risk_level} · {claim.status} · проверить до {dateInputValue(claim.next_review_at)}
              </p>
              <button
                type="button"
                className="mt-1 text-red-600 hover:underline"
                disabled={saving}
                onClick={() => void mutate("DELETE", undefined, `?kind=claim&itemId=${encodeURIComponent(claim.id)}`)}
              >
                Удалить
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-3 space-y-2">
          <textarea
            className="min-h-20 w-full rounded-xl border border-gray-200 px-3 py-2 text-xs text-charcoal"
            placeholder="Одно проверяемое утверждение"
            value={claimStatement}
            onChange={(event) => setClaimStatement(event.target.value)}
          />
          <Input placeholder="Тема: entry, money, legal…" value={claimTopic} onChange={(event) => setClaimTopic(event.target.value)} />
          <NativeSelect value={claimSourceId} onChange={(event) => setClaimSourceId(event.target.value)}>
            <option value="">Выберите источник</option>
            {data?.sources.map((item) => (
              <option key={item.source_id} value={item.source_id}>
                {item.source?.title ?? item.source_id}
              </option>
            ))}
          </NativeSelect>
          <NativeSelect value={claimRisk} onChange={(event) => setClaimRisk(event.target.value as CmsRiskLevel)}>
            {RISK_LEVELS.map((risk) => (
              <option key={risk.value} value={risk.value}>
                Риск: {risk.label.toLowerCase()}
              </option>
            ))}
          </NativeSelect>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="space-y-1 text-xs text-slate">
              <span>Проверено</span>
              <Input type="date" value={claimVerifiedAt} onChange={(event) => setClaimVerifiedAt(event.target.value)} />
            </label>
            <label className="space-y-1 text-xs text-slate">
              <span>Перепроверить</span>
              <Input type="date" value={claimReviewAt} onChange={(event) => setClaimReviewAt(event.target.value)} />
            </label>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            disabled={saving || !claimStatement.trim() || !claimTopic.trim() || !claimSourceId || !claimReviewAt}
            onClick={() => {
              void mutate("POST", {
                action: "add_claim",
                statement: claimStatement,
                topic: claimTopic,
                sourceId: claimSourceId,
                riskLevel: claimRisk,
                lastVerifiedAt: claimVerifiedAt,
                nextReviewAt: claimReviewAt,
              }).then(() => {
                setClaimStatement("");
                setClaimTopic("");
                setClaimReviewAt("");
              });
            }}
          >
            Добавить утверждение
          </Button>
        </div>
      </details>

      <p className="text-xs text-slate">
        Медиа: {data?.media.length ?? 0} · требуют проверки прав: {invalidMediaCount} · виджеты:{" "}
        {data?.widgets.length ?? 0}
      </p>
    </section>
  );
}
