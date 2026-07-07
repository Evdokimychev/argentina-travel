"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminSidebar";
import CapabilityGate from "@/components/admin/CapabilityGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { useAdminApi } from "@/hooks/useAdminApi";
import { cabinetCardClass } from "@/lib/cabinet-ui";
import type {
  SocialFeedConfig,
  SocialFeedPlacementConfig,
  SocialFeedPostConfig,
  SocialFeedSourceConfig,
} from "@/types/social-feed-config";

type SocialFeedAdminResponse = {
  config: SocialFeedConfig;
  seed: SocialFeedConfig;
  settingsKey: string;
};

type AdminTab = "sources" | "posts" | "placements";

const TAB_LABELS: Record<AdminTab, string> = {
  sources: "Источники",
  posts: "Публикации",
  placements: "Размещения",
};

function slugifyId(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function SocialFeedAdminView() {
  const { data, loading, error, refresh } = useAdminApi<SocialFeedAdminResponse>(
    "/api/admin/social-feed",
  );
  const [tab, setTab] = useState<AdminTab>("sources");
  const [config, setConfig] = useState<SocialFeedConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    if (data?.config) setConfig(structuredClone(data.config));
  }, [data?.config]);

  const sourceOptions = useMemo(
    () => (config?.sources ?? []).map((s) => ({ id: s.id, label: `${s.label} (@${s.handle})` })),
    [config?.sources],
  );

  const saveConfig = useCallback(async () => {
    if (!config) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch("/api/admin/social-feed", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config }),
      });
      const json = (await res.json()) as { error?: string; config?: SocialFeedConfig };
      if (!res.ok) throw new Error(json.error ?? "Ошибка сохранения");
      if (json.config) setConfig(json.config);
      setSaveMessage("Сохранено в site.social_feed");
      await refresh();
    } catch (saveError) {
      setSaveMessage(saveError instanceof Error ? saveError.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  }, [config, refresh]);

  function updateSource(index: number, patch: Partial<SocialFeedSourceConfig>) {
    setConfig((prev) => {
      if (!prev) return prev;
      const sources = [...prev.sources];
      sources[index] = { ...sources[index], ...patch };
      return { ...prev, sources };
    });
  }

  function addSource() {
    const id = `source-${Date.now()}`;
    setConfig((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sources: [
          ...prev.sources,
          {
            id,
            type: "instagram",
            handle: "",
            label: "Новый источник",
            profileUrl: "",
            enabled: true,
          },
        ],
      };
    });
  }

  function removeSource(index: number) {
    setConfig((prev) => {
      if (!prev) return prev;
      return { ...prev, sources: prev.sources.filter((_, i) => i !== index) };
    });
  }

  function updatePost(index: number, patch: Partial<SocialFeedPostConfig>) {
    setConfig((prev) => {
      if (!prev) return prev;
      const posts = [...prev.posts];
      posts[index] = { ...posts[index], ...patch };
      return { ...prev, posts };
    });
  }

  function addPost() {
    const firstSource = config?.sources.find((s) => s.enabled)?.id ?? "iv-evd";
    setConfig((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        posts: [
          ...prev.posts,
          {
            id: `post-${Date.now()}`,
            sourceId: firstSource,
            caption: "",
            permalink: "https://www.instagram.com/p/",
            enabled: true,
          },
        ],
      };
    });
  }

  function removePost(index: number) {
    setConfig((prev) => {
      if (!prev) return prev;
      return { ...prev, posts: prev.posts.filter((_, i) => i !== index) };
    });
  }

  function updatePlacement(index: number, patch: Partial<SocialFeedPlacementConfig>) {
    setConfig((prev) => {
      if (!prev) return prev;
      const placements = [...prev.placements];
      placements[index] = { ...placements[index], ...patch };
      return { ...prev, placements };
    });
  }

  function togglePlacementSource(index: number, sourceId: string) {
    setConfig((prev) => {
      if (!prev) return prev;
      const placements = [...prev.placements];
      const current = placements[index];
      const has = current.sourceIds.includes(sourceId);
      placements[index] = {
        ...current,
        sourceIds: has
          ? current.sourceIds.filter((id) => id !== sourceId)
          : [...current.sourceIds, sourceId],
      };
      return { ...prev, placements };
    });
  }

  function addPlacement() {
    setConfig((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        placements: [
          ...prev.placements,
          {
            id: "custom:page",
            label: "Новое размещение",
            sourceIds: ["iv-evd"],
            layout: "carousel",
            limit: 8,
            minItems: 3,
            enabled: true,
          },
        ],
      };
    });
  }

  function removePlacement(index: number) {
    setConfig((prev) => {
      if (!prev) return prev;
      return { ...prev, placements: prev.placements.filter((_, i) => i !== index) };
    });
  }

  return (
    <CapabilityGate capability="content.edit">
      <AdminPageShell>
        <AdminPageHeader
          title="Социальная лента"
          subtitle="Источники Instagram, курируемые публикации и размещения на страницах"
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={() => void refresh()} disabled={loading}>
                Обновить
              </Button>
              <Button onClick={() => void saveConfig()} disabled={saving || !config}>
                <Save className="mr-2 h-4 w-4" aria-hidden />
                {saving ? "Сохранение…" : "Сохранить"}
              </Button>
            </div>
          }
        />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {saveMessage ? (
          <p className={`text-sm ${saveMessage.startsWith("Сохранено") ? "text-emerald-700" : "text-red-600"}`}>
            {saveMessage}
          </p>
        ) : null}
        {loading && !config ? <p className="text-sm text-slate">Загрузка…</p> : null}

        {config ? (
          <>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(TAB_LABELS) as AdminTab[]).map((key) => (
                <Button
                  key={key}
                  variant={tab === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTab(key)}
                >
                  {TAB_LABELS[key]}
                </Button>
              ))}
            </div>

            {tab === "sources" ? (
              <section className={`${cabinetCardClass} space-y-4 p-5`}>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-heading text-lg font-bold text-charcoal">
                    Источники ({config.sources.length})
                  </h2>
                  <Button type="button" variant="outline" size="sm" onClick={addSource}>
                    <Plus className="mr-1 h-4 w-4" aria-hidden />
                    Добавить
                  </Button>
                </div>
                <div className="space-y-4">
                  {config.sources.map((source, index) => (
                    <div key={source.id} className="rounded-xl border border-gray-100 p-4">
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <label className="block text-sm">
                          <span className="text-slate">ID</span>
                          <Input
                            className="mt-1 font-mono text-xs"
                            value={source.id}
                            onChange={(e) => updateSource(index, { id: slugifyId(e.target.value) })}
                          />
                        </label>
                        <label className="block text-sm">
                          <span className="text-slate">Handle</span>
                          <Input
                            className="mt-1"
                            value={source.handle}
                            onChange={(e) => updateSource(index, { handle: e.target.value.replace(/^@/, "") })}
                          />
                        </label>
                        <label className="block text-sm">
                          <span className="text-slate">Название</span>
                          <Input
                            className="mt-1"
                            value={source.label}
                            onChange={(e) => updateSource(index, { label: e.target.value })}
                          />
                        </label>
                        <label className="block text-sm sm:col-span-2">
                          <span className="text-slate">URL профиля</span>
                          <Input
                            className="mt-1 font-mono text-xs"
                            value={source.profileUrl}
                            onChange={(e) => updateSource(index, { profileUrl: e.target.value })}
                          />
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={source.enabled}
                            onChange={(e) => updateSource(index, { enabled: e.target.checked })}
                          />
                          <span>Включён</span>
                        </label>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="mt-3 text-red-600"
                        onClick={() => removeSource(index)}
                      >
                        <Trash2 className="mr-1 h-4 w-4" aria-hidden />
                        Удалить
                      </Button>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {tab === "posts" ? (
              <section className={`${cabinetCardClass} space-y-4 p-5`}>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-heading text-lg font-bold text-charcoal">
                    Публикации ({config.posts.length})
                  </h2>
                  <Button type="button" variant="outline" size="sm" onClick={addPost}>
                    <Plus className="mr-1 h-4 w-4" aria-hidden />
                    Добавить
                  </Button>
                </div>
                <p className="text-sm text-slate">
                  Укажите mediaAssetId из медиатеки или прямой imageUrl. Permalink — ссылка на пост в Instagram.
                </p>
                <div className="space-y-4">
                  {config.posts.map((post, index) => (
                    <div key={post.id} className="rounded-xl border border-gray-100 p-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block text-sm">
                          <span className="text-slate">ID</span>
                          <Input
                            className="mt-1 font-mono text-xs"
                            value={post.id}
                            onChange={(e) => updatePost(index, { id: slugifyId(e.target.value) })}
                          />
                        </label>
                        <label className="block text-sm">
                          <span className="text-slate">Источник</span>
                          <NativeSelect
                            className="mt-1"
                            value={post.sourceId}
                            onChange={(e) => updatePost(index, { sourceId: e.target.value })}
                          >
                            {sourceOptions.map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.label}
                              </option>
                            ))}
                          </NativeSelect>
                        </label>
                        <label className="block text-sm">
                          <span className="text-slate">mediaAssetId</span>
                          <Input
                            className="mt-1 font-mono text-xs"
                            placeholder="place-buenos-aires-hero"
                            value={post.mediaAssetId ?? ""}
                            onChange={(e) =>
                              updatePost(index, {
                                mediaAssetId: e.target.value || undefined,
                              })
                            }
                          />
                        </label>
                        <label className="block text-sm">
                          <span className="text-slate">imageUrl (fallback)</span>
                          <Input
                            className="mt-1 font-mono text-xs"
                            value={post.imageUrl ?? ""}
                            onChange={(e) => updatePost(index, { imageUrl: e.target.value || undefined })}
                          />
                        </label>
                        <label className="block text-sm sm:col-span-2">
                          <span className="text-slate">Подпись</span>
                          <Input
                            className="mt-1"
                            value={post.caption ?? ""}
                            onChange={(e) => updatePost(index, { caption: e.target.value })}
                          />
                        </label>
                        <label className="block text-sm sm:col-span-2">
                          <span className="text-slate">Permalink Instagram</span>
                          <Input
                            className="mt-1 font-mono text-xs"
                            value={post.permalink}
                            onChange={(e) => updatePost(index, { permalink: e.target.value })}
                          />
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={post.enabled}
                            onChange={(e) => updatePost(index, { enabled: e.target.checked })}
                          />
                          <span>Опубликовано в ленте</span>
                        </label>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="mt-3 text-red-600"
                        onClick={() => removePost(index)}
                      >
                        <Trash2 className="mr-1 h-4 w-4" aria-hidden />
                        Удалить
                      </Button>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {tab === "placements" ? (
              <section className={`${cabinetCardClass} space-y-4 p-5`}>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-heading text-lg font-bold text-charcoal">
                    Размещения ({config.placements.length})
                  </h2>
                  <Button type="button" variant="outline" size="sm" onClick={addPlacement}>
                    <Plus className="mr-1 h-4 w-4" aria-hidden />
                    Добавить
                  </Button>
                </div>
                <p className="text-sm text-slate">
                  Ключи: <code className="font-mono text-xs">home</code>,{" "}
                  <code className="font-mono text-xs">destination:ba</code>,{" "}
                  <code className="font-mono text-xs">place:bariloche</code>,{" "}
                  <code className="font-mono text-xs">kb:article-id</code>
                </p>
                <div className="space-y-4">
                  {config.placements.map((placement, index) => (
                    <div key={`${placement.id}-${index}`} className="rounded-xl border border-gray-100 p-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block text-sm">
                          <span className="text-slate">ID размещения</span>
                          <Input
                            className="mt-1 font-mono text-xs"
                            value={placement.id}
                            onChange={(e) => updatePlacement(index, { id: e.target.value.trim() })}
                          />
                        </label>
                        <label className="block text-sm">
                          <span className="text-slate">Название</span>
                          <Input
                            className="mt-1"
                            value={placement.label}
                            onChange={(e) => updatePlacement(index, { label: e.target.value })}
                          />
                        </label>
                        <label className="block text-sm">
                          <span className="text-slate">Layout</span>
                          <NativeSelect
                            className="mt-1"
                            value={placement.layout ?? "carousel"}
                            onChange={(e) =>
                              updatePlacement(index, {
                                layout: e.target.value as SocialFeedPlacementConfig["layout"],
                              })
                            }
                          >
                            <option value="carousel">carousel</option>
                            <option value="grid">grid</option>
                            <option value="masonry">masonry</option>
                          </NativeSelect>
                        </label>
                        <label className="block text-sm">
                          <span className="text-slate">limit / minItems</span>
                          <div className="mt-1 flex gap-2">
                            <Input
                              type="number"
                              placeholder="limit"
                              value={placement.limit ?? ""}
                              onChange={(e) =>
                                updatePlacement(index, {
                                  limit: e.target.value ? Number(e.target.value) : undefined,
                                })
                              }
                            />
                            <Input
                              type="number"
                              placeholder="min"
                              value={placement.minItems ?? ""}
                              onChange={(e) =>
                                updatePlacement(index, {
                                  minItems: e.target.value ? Number(e.target.value) : undefined,
                                })
                              }
                            />
                          </div>
                        </label>
                        <label className="block text-sm sm:col-span-2">
                          <span className="text-slate">Заголовок</span>
                          <Input
                            className="mt-1"
                            value={placement.title ?? ""}
                            onChange={(e) => updatePlacement(index, { title: e.target.value || undefined })}
                          />
                        </label>
                        <label className="block text-sm sm:col-span-2">
                          <span className="text-slate">Подзаголовок</span>
                          <Input
                            className="mt-1"
                            value={placement.subtitle ?? ""}
                            onChange={(e) =>
                              updatePlacement(index, { subtitle: e.target.value || undefined })
                            }
                          />
                        </label>
                        <div className="sm:col-span-2">
                          <p className="text-sm text-slate">Источники</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {sourceOptions.map((option) => (
                              <label
                                key={option.id}
                                className="inline-flex items-center gap-2 rounded-full border border-gray-100 px-3 py-1 text-xs"
                              >
                                <input
                                  type="checkbox"
                                  checked={placement.sourceIds.includes(option.id)}
                                  onChange={() => togglePlacementSource(index, option.id)}
                                />
                                {option.label}
                              </label>
                            ))}
                          </div>
                        </div>
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={placement.enabled !== false}
                            onChange={(e) => updatePlacement(index, { enabled: e.target.checked })}
                          />
                          <span>Включено</span>
                        </label>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="mt-3 text-red-600"
                        onClick={() => removePlacement(index)}
                      >
                        <Trash2 className="mr-1 h-4 w-4" aria-hidden />
                        Удалить
                      </Button>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </>
        ) : null}
      </AdminPageShell>
    </CapabilityGate>
  );
}
