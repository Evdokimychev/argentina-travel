"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  Lock,
  LockOpen,
  MessageSquareText,
  Pin,
  PinOff,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminSidebar";
import CapabilityGate from "@/components/admin/CapabilityGate";
import InlineFeedback from "@/components/feedback/InlineFeedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { useAdminApi } from "@/hooks/useAdminApi";
import { cabinetCardClass } from "@/lib/cabinet-ui";
import type {
  AdminForumCategory,
  AdminForumThread,
} from "@/lib/admin/forum-admin-contract";

type Overview = {
  categories?: AdminForumCategory[];
  threads?: AdminForumThread[];
};

type CategoryDraft = {
  title: string;
  description: string;
  sortOrder: string;
  publicRead: boolean;
  isActive: boolean;
};

type Feedback = {
  variant: "success" | "error";
  title: string;
  description: string;
};

function toDraft(category: AdminForumCategory): CategoryDraft {
  return {
    title: category.title,
    description: category.description ?? "",
    sortOrder: String(category.sortOrder),
    publicRead: category.publicRead,
    isActive: category.isActive,
  };
}

async function requestForum(url: string, method: string, body: unknown): Promise<void> {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({})) as { error?: string };
  if (!response.ok) {
    throw new Error(payload.error ?? "Не удалось выполнить действие");
  }
}

export default function ForumAdminView() {
  const { data, loading, error, refresh } = useAdminApi<Overview>("/api/admin/forum");
  const categories = useMemo(() => data?.categories ?? [], [data?.categories]);
  const threads = useMemo(() => data?.threads ?? [], [data?.threads]);
  const [drafts, setDrafts] = useState<Record<string, CategoryDraft>>({});
  const [newDraft, setNewDraft] = useState<CategoryDraft>({
    title: "",
    description: "",
    sortOrder: "10",
    publicRead: true,
    isActive: true,
  });
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    setDrafts(Object.fromEntries(categories.map((category) => [category.id, toDraft(category)])));
  }, [categories]);

  const filteredThreads = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return threads.filter((thread) => {
      if (categoryFilter !== "all" && thread.categoryId !== categoryFilter) return false;
      return !needle || `${thread.title} ${thread.categoryTitle}`.toLowerCase().includes(needle);
    });
  }, [categoryFilter, query, threads]);

  function patchDraft(id: string, patch: Partial<CategoryDraft>) {
    setDrafts((current) => ({
      ...current,
      [id]: { ...current[id], ...patch },
    }));
  }

  async function createCategory() {
    setBusyKey("create");
    setFeedback(null);
    try {
      await requestForum("/api/admin/forum", "POST", {
        ...newDraft,
        sortOrder: Number(newDraft.sortOrder),
      });
      setNewDraft({
        title: "",
        description: "",
        sortOrder: String((categories.at(-1)?.sortOrder ?? 0) + 10),
        publicRead: true,
        isActive: true,
      });
      await refresh();
      setFeedback({
        variant: "success",
        title: "Раздел создан",
        description: "Он уже доступен на форуме согласно выбранной видимости.",
      });
    } catch (createError) {
      setFeedback({
        variant: "error",
        title: "Не удалось создать раздел",
        description: createError instanceof Error ? createError.message : "Попробуйте ещё раз.",
      });
    } finally {
      setBusyKey(null);
    }
  }

  async function saveCategory(category: AdminForumCategory) {
    const draft = drafts[category.id];
    if (!draft) return;
    setBusyKey(`save:${category.id}`);
    setFeedback(null);
    try {
      await requestForum("/api/admin/forum", "PATCH", {
        id: category.id,
        expectedUpdatedAt: category.updatedAt,
        ...draft,
        sortOrder: Number(draft.sortOrder),
      });
      await refresh();
      setFeedback({
        variant: "success",
        title: "Настройки сохранены",
        description: `Раздел «${draft.title}» обновлён.`,
      });
    } catch (saveError) {
      await refresh();
      setFeedback({
        variant: "error",
        title: "Не удалось сохранить раздел",
        description: saveError instanceof Error ? saveError.message : "Попробуйте ещё раз.",
      });
    } finally {
      setBusyKey(null);
    }
  }

  async function deleteCategory(category: AdminForumCategory) {
    setBusyKey(`delete:${category.id}`);
    setFeedback(null);
    try {
      await requestForum("/api/admin/forum", "DELETE", {
        id: category.id,
        expectedUpdatedAt: category.updatedAt,
      });
      setDeleteConfirmId(null);
      await refresh();
      setFeedback({
        variant: "success",
        title: "Пустой раздел удалён",
        description: `Раздел «${category.title}» больше не отображается.`,
      });
    } catch (deleteError) {
      await refresh();
      setFeedback({
        variant: "error",
        title: "Раздел не удалён",
        description: deleteError instanceof Error ? deleteError.message : "Попробуйте ещё раз.",
      });
    } finally {
      setBusyKey(null);
    }
  }

  async function changeThread(
    thread: AdminForumThread,
    next: { pinned: boolean; locked: boolean },
  ) {
    setBusyKey(`thread:${thread.id}`);
    setFeedback(null);
    try {
      await requestForum(`/api/admin/forum/threads/${thread.id}`, "PATCH", {
        expectedPinned: thread.pinned,
        expectedLocked: thread.locked,
        nextPinned: next.pinned,
        nextLocked: next.locked,
      });
      await refresh();
      setFeedback({
        variant: "success",
        title: "Тема обновлена",
        description: next.locked !== thread.locked
          ? (next.locked ? "Новые ответы в теме закрыты." : "Участники снова могут отвечать.")
          : (next.pinned ? "Тема закреплена вверху раздела." : "Закрепление снято."),
      });
    } catch (threadError) {
      await refresh();
      setFeedback({
        variant: "error",
        title: "Не удалось изменить тему",
        description: threadError instanceof Error ? threadError.message : "Попробуйте ещё раз.",
      });
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <CapabilityGate capability="marketplace.moderation">
      <AdminPageShell>
        <AdminPageHeader
          title="Управление форумом"
          subtitle="Разделы, видимость и порядок тем — без удаления обсуждений"
          actions={(
            <Link
              href="/forum"
              target="_blank"
              className="inline-flex h-11 items-center rounded-button border border-border-subtle px-4 text-sm font-semibold text-foreground hover:bg-surface-muted"
            >
              Открыть форум
            </Link>
          )}
        />

        {error ? <InlineFeedback variant="error" title="Форум недоступен" description={error} /> : null}
        {feedback ? <InlineFeedback {...feedback} /> : null}

        <section className={`${cabinetCardClass} p-5`}>
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-sky/10 p-2 text-sky"><Plus className="h-5 w-5" aria-hidden /></div>
            <div>
              <h2 className="font-heading text-lg font-bold text-foreground">Новый раздел</h2>
              <p className="mt-1 text-sm text-muted">Адрес страницы создастся автоматически из названия.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-foreground">
              Название
              <Input
                className="mt-1"
                value={newDraft.title}
                maxLength={100}
                onChange={(event) => setNewDraft({ ...newDraft, title: event.target.value })}
                placeholder="Например, Жизнь в Аргентине"
              />
            </label>
            <label className="text-sm font-medium text-foreground">
              Порядок в списке
              <Input
                className="mt-1"
                type="number"
                min={0}
                max={32767}
                value={newDraft.sortOrder}
                onChange={(event) => setNewDraft({ ...newDraft, sortOrder: event.target.value })}
              />
            </label>
            <label className="text-sm font-medium text-foreground md:col-span-2">
              Описание
              <Textarea
                className="mt-1"
                value={newDraft.description}
                maxLength={1000}
                onChange={(event) => setNewDraft({ ...newDraft, description: event.target.value })}
                placeholder="О чём участники могут говорить в этом разделе"
              />
            </label>
            <label className="text-sm font-medium text-foreground">
              Кто видит раздел
              <NativeSelect
                className="mt-1"
                value={newDraft.publicRead ? "public" : "members"}
                onChange={(event) => setNewDraft({ ...newDraft, publicRead: event.target.value === "public" })}
              >
                <option value="public">Все посетители</option>
                <option value="members">Только вошедшие пользователи</option>
              </NativeSelect>
            </label>
            <label className="flex items-center gap-3 self-end rounded-xl border border-border-subtle px-4 py-3 text-sm font-medium text-foreground">
              <input
                type="checkbox"
                checked={newDraft.isActive}
                onChange={(event) => setNewDraft({ ...newDraft, isActive: event.target.checked })}
              />
              Включить сразу после создания
            </label>
          </div>
          <Button
            className="mt-5"
            onClick={() => void createCategory()}
            loading={busyKey === "create"}
            disabled={!newDraft.title.trim()}
          >
            <Plus className="h-4 w-4" aria-hidden /> Создать раздел
          </Button>
        </section>

        <section>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-heading text-xl font-bold text-foreground">Разделы форума</h2>
              <p className="mt-1 text-sm text-muted">
                Скрытие безопаснее удаления: все темы и сообщения сохраняются.
              </p>
            </div>
            <span className="text-sm text-muted">{loading ? "Загружаем…" : `${categories.length} разделов`}</span>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            {categories.map((category) => {
              const draft = drafts[category.id] ?? toDraft(category);
              const deleting = deleteConfirmId === category.id;
              return (
                <article key={category.id} className={`${cabinetCardClass} p-5`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-heading text-lg font-bold text-foreground">{category.title}</h3>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${category.isActive ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                          {category.isActive ? "Показывается" : "Скрыт"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted">{category.threadCount} тем · /forum/{category.slug}</p>
                    </div>
                    {category.isActive ? (
                      <Link href={`/forum/${category.slug}`} target="_blank" className="text-sm font-semibold text-sky hover:underline">
                        Посмотреть
                      </Link>
                    ) : (
                      <span className="text-sm font-medium text-muted">Скрыт на сайте</span>
                    )}
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <label className="text-sm font-medium text-foreground">
                      Название
                      <Input className="mt-1" value={draft.title} maxLength={100} onChange={(event) => patchDraft(category.id, { title: event.target.value })} />
                    </label>
                    <label className="text-sm font-medium text-foreground">
                      Порядок
                      <Input className="mt-1" type="number" min={0} max={32767} value={draft.sortOrder} onChange={(event) => patchDraft(category.id, { sortOrder: event.target.value })} />
                    </label>
                    <label className="text-sm font-medium text-foreground sm:col-span-2">
                      Описание
                      <Textarea className="mt-1 min-h-20" value={draft.description} maxLength={1000} onChange={(event) => patchDraft(category.id, { description: event.target.value })} />
                    </label>
                    <label className="text-sm font-medium text-foreground">
                      Кто видит
                      <NativeSelect className="mt-1" value={draft.publicRead ? "public" : "members"} onChange={(event) => patchDraft(category.id, { publicRead: event.target.value === "public" })}>
                        <option value="public">Все посетители</option>
                        <option value="members">Только вошедшие</option>
                      </NativeSelect>
                    </label>
                    <label className="flex items-center gap-3 self-end rounded-xl border border-border-subtle px-4 py-3 text-sm font-medium text-foreground">
                      <input type="checkbox" checked={draft.isActive} onChange={(event) => patchDraft(category.id, { isActive: event.target.checked })} />
                      {draft.isActive ? <Eye className="h-4 w-4 text-emerald-600" aria-hidden /> : <EyeOff className="h-4 w-4 text-muted" aria-hidden />}
                      Показывать раздел
                    </label>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => void saveCategory(category)} loading={busyKey === `save:${category.id}`}>
                      <Save className="h-4 w-4" aria-hidden /> Сохранить
                    </Button>
                    {!deleting ? (
                      <Button size="sm" variant="ghost" onClick={() => setDeleteConfirmId(category.id)} disabled={category.threadCount > 0} title={category.threadCount > 0 ? "Раздел с темами можно скрыть, но нельзя удалить" : undefined}>
                        <Trash2 className="h-4 w-4" aria-hidden /> Удалить пустой
                      </Button>
                    ) : (
                      <>
                        <Button size="sm" variant="destructive" onClick={() => void deleteCategory(category)} loading={busyKey === `delete:${category.id}`}>
                          Подтвердить удаление
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setDeleteConfirmId(null)}>Отмена</Button>
                      </>
                    )}
                  </div>
                  {category.threadCount > 0 ? (
                    <p className="mt-3 text-xs text-muted">Раздел с темами нельзя удалить. Его можно безопасно скрыть.</p>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>

        <section className={`${cabinetCardClass} p-5`}>
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-violet-50 p-2 text-violet-700"><MessageSquareText className="h-5 w-5" aria-hidden /></div>
            <div>
              <h2 className="font-heading text-xl font-bold text-foreground">Темы</h2>
              <p className="mt-1 text-sm text-muted">Закрепляйте важное и временно закрывайте новые ответы.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_260px]">
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Найти тему" aria-label="Поиск тем форума" />
            <NativeSelect value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} aria-label="Фильтр по разделу">
              <option value="all">Все разделы</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.title}</option>)}
            </NativeSelect>
          </div>
          <div className="mt-4 divide-y divide-border-subtle">
            {filteredThreads.map((thread) => (
              <article key={thread.id} className="flex flex-col gap-3 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/forum/${thread.categorySlug}/${thread.id}`} target="_blank" className="font-semibold text-foreground hover:text-sky hover:underline">
                      {thread.title}
                    </Link>
                    {thread.pinned ? <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">Закреплена</span> : null}
                    {thread.locked ? <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">Ответы закрыты</span> : null}
                  </div>
                  <p className="mt-1 text-xs text-muted">{thread.categoryTitle} · {thread.postCount} сообщений</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" disabled={busyKey === `thread:${thread.id}`} onClick={() => void changeThread(thread, { pinned: !thread.pinned, locked: thread.locked })}>
                    {thread.pinned ? <PinOff className="h-4 w-4" aria-hidden /> : <Pin className="h-4 w-4" aria-hidden />}
                    {thread.pinned ? "Открепить" : "Закрепить"}
                  </Button>
                  <Button size="sm" variant="secondary" disabled={busyKey === `thread:${thread.id}`} onClick={() => void changeThread(thread, { pinned: thread.pinned, locked: !thread.locked })}>
                    {thread.locked ? <LockOpen className="h-4 w-4" aria-hidden /> : <Lock className="h-4 w-4" aria-hidden />}
                    {thread.locked ? "Открыть ответы" : "Закрыть ответы"}
                  </Button>
                </div>
              </article>
            ))}
            {!loading && filteredThreads.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted">Темы не найдены.</p>
            ) : null}
          </div>
        </section>
      </AdminPageShell>
    </CapabilityGate>
  );
}
