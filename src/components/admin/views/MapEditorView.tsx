"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, MapPinned, Save } from "lucide-react";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminSidebar";
import CapabilityGate from "@/components/admin/CapabilityGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { useAdminApi } from "@/hooks/useAdminApi";
import { cabinetCardClass } from "@/lib/cabinet-ui";
import type { MapObject } from "@/lib/map-types";

type Response = { items?: MapObject[] };

export default function MapEditorView() {
  const { data, loading, error, refresh } = useAdminApi<Response>("/api/admin/content/map");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<MapObject | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const items = useMemo(() => data?.items ?? [], [data?.items]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (needle
      ? items.filter((item) => `${item.title} ${item.meta ?? ""} ${item.region}`.toLowerCase().includes(needle))
      : items
    ).slice(0, 80);
  }, [items, query]);

  useEffect(() => {
    const selected = items.find((item) => item.id === selectedId) ?? null;
    setDraft(selected ? { ...selected, tags: [...(selected.tags ?? [])] } : null);
  }, [items, selectedId]);

  async function save() {
    if (!draft) return;
    setSaving(true);
    setFeedback(null);
    try {
      const response = await fetch("/api/admin/content/map", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          objectId: draft.id,
          latitude: draft.latitude,
          longitude: draft.longitude,
          importance: draft.importance,
          featured: draft.featured,
          editorialPriority: draft.editorialPriority,
          qualityScore: draft.qualityScore,
          source: draft.source,
          sourceUrl: draft.sourceUrl,
          sourceVerifiedAt: draft.sourceVerifiedAt,
          minZoom: draft.minZoom,
          maxZoom: draft.maxZoom,
          region: draft.region,
          tags: draft.tags,
          status: draft.status,
          curatorNote: draft.curatorNote,
          relatedArticleHref: draft.relatedArticles?.[0]?.href,
          relatedTourHref: draft.relatedTours?.[0]?.href,
          relatedAirportIata: draft.airportDetails?.iata,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Не удалось сохранить объект");
      setFeedback("Настройки объекта сохранены");
      await refresh();
    } catch (saveError) {
      setFeedback(saveError instanceof Error ? saveError.message : "Не удалось сохранить объект");
    } finally {
      setSaving(false);
    }
  }

  return (
    <CapabilityGate capability="content.edit">
      <AdminPageShell>
        <AdminPageHeader title="Редактор карты" subtitle="Важность, масштаб, источники и связи объектов карты" />
        {error ? <p className="text-sm text-error">{error}</p> : null}
        <div className="grid gap-5 xl:grid-cols-[minmax(260px,0.7fr)_minmax(0,1.3fr)]">
          <section className={`${cabinetCardClass} p-4`}>
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Найти место или аэропорт" aria-label="Поиск объектов карты" />
            <p className="mt-3 text-xs text-muted">{loading ? "Загружаем…" : `${filtered.length} объектов в списке`}</p>
            <ul className="mt-2 max-h-[65vh] divide-y divide-border-subtle overflow-y-auto">
              {filtered.map((item) => (
                <li key={item.id}>
                  <button type="button" onClick={() => setSelectedId(item.id)} className={`w-full px-2 py-3 text-left ${selectedId === item.id ? "bg-sky/10" : "hover:bg-surface-muted"}`}>
                    <span className="block text-sm font-semibold text-foreground">{item.title}</span>
                    <span className="mt-0.5 block text-xs text-muted">{item.kind} · {item.region}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className={`${cabinetCardClass} p-5`}>
            {!draft ? (
              <div className="flex min-h-64 flex-col items-center justify-center text-center">
                <MapPinned className="h-10 w-10 text-muted" aria-hidden />
                <p className="mt-3 text-sm font-semibold text-foreground">Выберите объект карты</p>
                <p className="mt-1 text-xs text-muted">Изменения сохраняются как редакционные настройки, исходные данные остаются нетронутыми.</p>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><h2 className="font-heading text-xl font-bold text-foreground">{draft.title}</h2><p className="text-sm text-muted">{draft.id}</p></div>
                  <Link href={`/mapa-argentina?selected=${encodeURIComponent(draft.id)}`} target="_blank" className="inline-flex items-center gap-1 text-sm font-semibold text-sky hover:underline">Предпросмотр <ExternalLink className="h-4 w-4" /></Link>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {([
                    ["Широта", "latitude", -90, 90], ["Долгота", "longitude", -180, 180],
                    ["Важность", "importance", 0, 100], ["Редакционный приоритет", "editorialPriority", 0, 100],
                    ["Качество данных", "qualityScore", 0, 100], ["Минимальный масштаб", "minZoom", 0, 22],
                    ["Максимальный масштаб", "maxZoom", 0, 22],
                  ] as const).map(([label, key, min, max]) => (
                    <label key={key} className="text-sm"><span className="text-muted">{label}</span><Input type="number" min={min} max={max} value={draft[key] ?? ""} onChange={(event) => setDraft({ ...draft, [key]: Number(event.target.value) })} className="mt-1" /></label>
                  ))}
                  <label className="text-sm"><span className="text-muted">Статус</span><NativeSelect value={draft.status ?? "published"} onChange={(event) => setDraft({ ...draft, status: event.target.value as MapObject["status"] })} className="mt-1"><option value="published">Показывать</option><option value="needs_review">Нужна проверка</option><option value="hidden">Скрыть</option></NativeSelect></label>
                  <label className="flex items-center gap-2 self-end py-3 text-sm font-medium"><input type="checkbox" checked={draft.featured === true} onChange={(event) => setDraft({ ...draft, featured: event.target.checked })} />Приоритетный объект</label>
                  <label className="text-sm sm:col-span-2"><span className="text-muted">Источник</span><Input value={draft.source ?? ""} onChange={(event) => setDraft({ ...draft, source: event.target.value })} className="mt-1" /></label>
                  <label className="text-sm"><span className="text-muted">Ссылка на источник</span><Input value={draft.sourceUrl ?? ""} onChange={(event) => setDraft({ ...draft, sourceUrl: event.target.value })} className="mt-1" /></label>
                  <label className="text-sm"><span className="text-muted">Дата проверки</span><Input type="date" value={draft.sourceVerifiedAt ?? ""} onChange={(event) => setDraft({ ...draft, sourceVerifiedAt: event.target.value })} className="mt-1" /></label>
                  <label className="text-sm sm:col-span-2"><span className="text-muted">Заметка куратора</span><Textarea value={draft.curatorNote ?? ""} onChange={(event) => setDraft({ ...draft, curatorNote: event.target.value })} className="mt-1" /></label>
                </div>
                {feedback ? <p className="text-sm text-muted" role="status">{feedback}</p> : null}
                <Button type="button" onClick={() => void save()} loading={saving}><Save className="h-4 w-4" />Сохранить настройки</Button>
              </div>
            )}
          </section>
        </div>
      </AdminPageShell>
    </CapabilityGate>
  );
}
